import { Color, MeshBasicMaterial, type ColorRepresentation, type Material, type Object3D, type Texture } from 'three'

type MaterialWithSurface = Material & {
  color?: Color
  map?: Texture | null
  alphaMap?: Texture | null
  alphaTest?: number
  vertexColors?: boolean
  transparent?: boolean
  opacity?: number
  side?: number
  depthTest?: boolean
  depthWrite?: boolean
}

const originalColors = new WeakMap<Material, Color>()

export function getOwnerTintOverride(meshName: string, materialName: string, ownerColor?: ColorRepresentation) {
  return materialName.startsWith('OWNER_TINT') || meshName === 'Limestone parcel curb' ? ownerColor : undefined
}

export function createUnlitMaterial(source: Material, colorOverride?: ColorRepresentation, dimmed = false) {
  const surface = source as MaterialWithSurface
  const material = new MeshBasicMaterial({
    color: colorOverride ?? surface.color ?? '#ffffff',
    map: surface.map ?? null,
    alphaMap: surface.alphaMap ?? null,
    alphaTest: surface.alphaTest ?? 0,
    vertexColors: surface.vertexColors ?? false,
    transparent: surface.transparent ?? false,
    opacity: surface.opacity ?? 1,
    side: surface.side,
    depthTest: surface.depthTest ?? true,
    depthWrite: surface.depthWrite ?? true,
    toneMapped: source.toneMapped,
  })
  material.name = source.name
  material.visible = source.visible
  material.userData = { ...source.userData }
  if (dimmed) material.color.copy(reduceColorContrast(material.color))
  return material
}

export function reduceColorContrast(color: Color, strength = 0.8) {
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722
  const retainedContrast = Math.max(0, 1 - strength)
  const dimmed = new Color(
    luminance + (color.r - luminance) * retainedContrast,
    luminance + (color.g - luminance) * retainedContrast,
    luminance + (color.b - luminance) * retainedContrast,
  )
  return dimmed.multiplyScalar(0.52)
}

export function applySelectionContrast(root: Object3D, dimmed: boolean) {
  const visit = (object: Object3D) => {
    if (object !== root && object.userData.selectionContrastManaged === true) return
    const mesh = object as Object3D & { isMesh?: boolean; material?: Material | Material[] }
    if (mesh.isMesh && mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const material of materials) {
        const surface = material as MaterialWithSurface
        if (!(surface.color instanceof Color)) continue
        if (!originalColors.has(material)) originalColors.set(material, surface.color.clone())
        const original = originalColors.get(material)
        if (!original) continue
        surface.color.copy(dimmed ? reduceColorContrast(original) : original)
      }
    }
    object.children.forEach(visit)
  }
  visit(root)
}
