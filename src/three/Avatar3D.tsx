import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

/**
 * Avatar 3D réaliste.
 *
 * Démo : modèle d'exemple MetaPerson (Avatar SDK, licence BSD-3).
 * Production : le GLB généré à partir du selfie de l'utilisateur remplacera `src`
 * (même format : tête réaliste, corps simplifié, cheveux et tenue séparés).
 */

export const DEMO_AVATAR_URL = '/models/avatar-demo.glb'

export type Framing = 'face' | 'bust' | 'body'

export interface AvatarLookInput {
  hair: string | null
  outfit: string | null
  skin: number
  background: string
}

const FRAMING: Record<Framing, { target: [number, number, number]; distance: number; fov: number }> = {
  face: { target: [0, 1.625, 0], distance: 0.78, fov: 28 },
  bust: { target: [0, 1.5, 0], distance: 1.15, fov: 30 },
  body: { target: [0, 0.95, 0], distance: 3.3, fov: 32 },
}

type TintUniforms = { uTint: { value: THREE.Color }; uTintAmt: { value: number }; uGain: { value: number }; uSkin: { value: number } }

/** Teinte “luminance” : permet de changer la couleur des cheveux ou de la tenue tout en gardant les détails. */
function patchMaterial(mat: THREE.MeshStandardMaterial, kind: 'tint' | 'skin', gain = 3): TintUniforms {
  const uniforms: TintUniforms = {
    uTint: { value: new THREE.Color('#ffffff') },
    uTintAmt: { value: 0 },
    uGain: { value: gain },
    uSkin: { value: 0 },
  }
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.fragmentShader =
      'uniform vec3 uTint;\nuniform float uTintAmt;\nuniform float uGain;\nuniform float uSkin;\n' +
      shader.fragmentShader.replace(
        '#include <map_fragment>',
        kind === 'tint'
          ? `#include <map_fragment>
            float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            vec3 tinted = uTint * clamp(lum * uGain, 0.0, 1.6);
            diffuseColor.rgb = mix(diffuseColor.rgb, tinted, uTintAmt);`
          : `#include <map_fragment>
            vec3 darker = diffuseColor.rgb * vec3(0.70, 0.60, 0.52);
            vec3 lighter = mix(diffuseColor.rgb, vec3(1.0, 0.86, 0.78), 0.22);
            diffuseColor.rgb = uSkin >= 0.0 ? mix(diffuseColor.rgb, darker, uSkin) : mix(diffuseColor.rgb, lighter, -uSkin);`,
      )
  }
  mat.customProgramCacheKey = () => `maya-${kind}`
  return uniforms
}

/** Le modèle arrive en T-pose : on abaisse les bras pour une posture naturelle. */
function relaxArms(root: THREE.Object3D) {
  root.updateMatrixWorld(true)
  for (const side of ['Left', 'Right'] as const) {
    const arm = root.getObjectByName(`${side}Arm`) as THREE.Bone | undefined
    const fore = root.getObjectByName(`${side}ForeArm`) as THREE.Bone | undefined
    if (!arm || !fore || !arm.parent) continue
    const a = arm.getWorldPosition(new THREE.Vector3())
    const f = fore.getWorldPosition(new THREE.Vector3())
    const cur = f.clone().sub(a).normalize()
    const sign = Math.sign(cur.x) || 1
    const target = new THREE.Vector3(sign * 0.2, -1, 0.06).normalize()
    const delta = new THREE.Quaternion().setFromUnitVectors(cur, target)
    const armWorld = arm.getWorldQuaternion(new THREE.Quaternion())
    const parentWorld = arm.parent.getWorldQuaternion(new THREE.Quaternion())
    arm.quaternion.copy(parentWorld.invert().multiply(delta).multiply(armWorld))
    arm.updateMatrixWorld(true)
    // Léger pli du coude
    fore.rotateX(-0.12)
  }
  root.updateMatrixWorld(true)
}

function AvatarModel({ url, look }: { url: string; look: AvatarLookInput }) {
  const gltf = useGLTF(url)

  const { scene, hairU, outfitU, skinU } = useMemo(() => {
    const scene = cloneSkinned(gltf.scene) as THREE.Group
    let hairU: TintUniforms | null = null
    let outfitU: TintUniforms | null = null
    const skinU: TintUniforms[] = []
    const hairExtra: THREE.Mesh[] = []

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      mesh.frustumCulled = false
      mesh.castShadow = true
      const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
      mesh.material = mat
      if (mat.map) mat.map.anisotropy = 8

      if (mesh.name === 'haircut') {
        hairU = patchMaterial(mat, 'tint', 3.2)
        // Passe 1 : partie dense des cheveux (écrit la profondeur, pas de problème de tri)
        mat.transparent = false
        mat.alphaTest = 0.55
        mat.depthWrite = true
        mat.side = THREE.DoubleSide
        // Passe 2 : mèches fines semi-transparentes par-dessus
        const soft = mesh.clone() as THREE.Mesh
        const softMat = mat.clone()
        softMat.transparent = true
        softMat.alphaTest = 0.02
        softMat.depthWrite = false
        softMat.side = THREE.DoubleSide
        soft.material = softMat
        soft.renderOrder = 2
        const u2 = patchMaterial(softMat, 'tint', 3.2)
        // Les deux passes partagent les mêmes uniforms
        u2.uTint = hairU.uTint
        u2.uTintAmt = hairU.uTintAmt
        hairExtra.push(soft)
      } else if (mesh.name === 'outfit') {
        outfitU = patchMaterial(mat, 'tint', 2.6)
        mat.roughness = 0.85
      } else if (mesh.name === 'AvatarHead' || mesh.name === 'AvatarBody') {
        skinU.push(patchMaterial(mat, 'skin'))
        mat.roughness = 0.62
      } else if (mesh.name.includes('Cornea')) {
        mat.transparent = true
        mat.opacity = 0.25
        mat.roughness = 0.05
      }
    })
    hairExtra.forEach((m) => scene.getObjectByName('haircut')?.parent?.add(m))
    relaxArms(scene)
    return { scene, hairU: hairU as TintUniforms | null, outfitU: outfitU as TintUniforms | null, skinU }
  }, [gltf.scene])

  useEffect(() => {
    if (hairU) {
      hairU.uTintAmt.value = look.hair ? 1 : 0
      if (look.hair) hairU.uTint.value.set(look.hair)
    }
    if (outfitU) {
      outfitU.uTintAmt.value = look.outfit ? 1 : 0
      if (look.outfit) outfitU.uTint.value.set(look.outfit)
    }
    skinU.forEach((u) => (u.uSkin.value = look.skin))
  }, [look.hair, look.outfit, look.skin, hairU, outfitU, skinU])

  // Respiration discrète
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.position.y = Math.sin(t * 1.4) * 0.0025
    group.current.rotation.y = Math.sin(t * 0.35) * 0.04
  })

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

function CameraRig({ framing, controls }: { framing: Framing; controls: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree()
  const goal = useRef({ target: new THREE.Vector3(), distance: 1, fov: 30 })
  const settling = useRef(0)

  useLayoutEffect(() => {
    const f = FRAMING[framing]
    goal.current.target.set(...f.target)
    goal.current.distance = f.distance
    goal.current.fov = f.fov
    settling.current = 1.4
  }, [framing])

  useFrame((_, dt) => {
    const c = controls.current
    if (!c || settling.current <= 0) return
    settling.current -= dt
    const k = 1 - Math.pow(0.0012, dt)
    c.target.lerp(goal.current.target, k)
    const dir = camera.position.clone().sub(c.target).normalize()
    const dist = THREE.MathUtils.lerp(camera.position.distanceTo(c.target), goal.current.distance, k)
    camera.position.copy(c.target.clone().add(dir.multiplyScalar(dist)))
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = THREE.MathUtils.lerp(cam.fov, goal.current.fov, k)
    cam.updateProjectionMatrix()
    c.update()
  })
  return null
}

export interface Avatar3DHandle {
  capture: () => string | null
}

interface Props {
  look: AvatarLookInput
  framing?: Framing
  interactive?: boolean
  url?: string
  className?: string
  onCaptureReady?: (capture: () => string | null) => void
}

export default function Avatar3D({ look, framing = 'bust', interactive = true, url = DEMO_AVATAR_URL, className, onCaptureReady }: Props) {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const f = FRAMING[framing]
  const start = useMemo(
    () => [f.target[0], f.target[1] + 0.02, f.target[2] + f.distance] as [number, number, number],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: start, fov: f.fov, near: 0.05, far: 50 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ gl, scene, camera }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          onCaptureReady?.(() => {
            try {
              gl.render(scene, camera)
              return gl.domElement.toDataURL('image/jpeg', 0.86)
            } catch {
              return null
            }
          })
        }}
      >
        <color attach="background" args={[look.background]} />
        <fog attach="fog" args={[look.background, 4, 9]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[1.6, 2.6, 2.2]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-2, 1.8, -1.5]} intensity={0.9} color="#cfe8d8" />
        <Suspense fallback={null}>
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={2.2} position={[0, 2.5, 3]} scale={[4, 2, 1]} />
            <Lightformer form="rect" intensity={1.2} color="#d9f2c4" position={[-3, 1.6, 0]} rotation-y={Math.PI / 2} scale={[3, 2, 1]} />
            <Lightformer form="rect" intensity={1.4} color="#ffe6d2" position={[3, 1.4, 1]} rotation-y={-Math.PI / 2} scale={[3, 2, 1]} />
            <Lightformer form="ring" intensity={1.6} position={[0, 4, -2]} scale={2} />
          </Environment>
          <AvatarModel url={url} look={look} />
          <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={3} blur={2.4} far={1.2} />
        </Suspense>
        <OrbitControls
          ref={controls}
          enabled={interactive}
          enablePan={false}
          enableZoom={interactive}
          minDistance={0.45}
          maxDistance={4}
          minPolarAngle={Math.PI * 0.28}
          maxPolarAngle={Math.PI * 0.62}
          rotateSpeed={0.6}
          target={f.target}
        />
        <CameraRig framing={framing} controls={controls} />
      </Canvas>
    </div>
  )
}

useGLTF.preload(DEMO_AVATAR_URL)
