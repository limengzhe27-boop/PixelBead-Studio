import type { ColorEntry } from '../types'

/**
 * Artkal Mini 系列（2.6mm，C 系列），C01–C72，共 72 色。（变量名沿用 MIDI 不改，避免牵连多处 import）
 *
 * ⚠️ 以下 hex 值为 PRD §10 的整理版本，上线前须对照 Artkal 官方实物色卡核准。
 * 不在此擅自修改，保持与产品文档一致。
 */
export const ARTKAL_MIDI_PALETTE: ColorEntry[] = [
  { code: 'C01', name_cn: '白色', name_en: 'White', hex: '#FEFEFE' },
  { code: 'C02', name_cn: '奶油白', name_en: 'Cream', hex: '#FFF8DC' },
  { code: 'C03', name_cn: '浅黄', name_en: 'Light Yellow', hex: '#FFF59D' },
  { code: 'C04', name_cn: '黄色', name_en: 'Yellow', hex: '#FFD600' },
  { code: 'C05', name_cn: '金黄', name_en: 'Gold', hex: '#FFA000' },
  { code: 'C06', name_cn: '橙色', name_en: 'Orange', hex: '#FF6D00' },
  { code: 'C07', name_cn: '浅橙', name_en: 'Light Orange', hex: '#FFAB40' },
  { code: 'C08', name_cn: '珊瑚红', name_en: 'Coral', hex: '#FF5252' },
  { code: 'C09', name_cn: '红色', name_en: 'Red', hex: '#D32F2F' },
  { code: 'C10', name_cn: '深红', name_en: 'Dark Red', hex: '#B71C1C' },
  { code: 'C11', name_cn: '玫红', name_en: 'Magenta', hex: '#E91E8C' },
  { code: 'C12', name_cn: '浅粉', name_en: 'Light Pink', hex: '#F8BBD0' },
  { code: 'C13', name_cn: '粉色', name_en: 'Pink', hex: '#F48FB1' },
  { code: 'C14', name_cn: '热粉', name_en: 'Hot Pink', hex: '#FF4081' },
  { code: 'C15', name_cn: '紫罗兰', name_en: 'Violet', hex: '#CE93D8' },
  { code: 'C16', name_cn: '薰衣草', name_en: 'Lavender', hex: '#B39DDB' },
  { code: 'C17', name_cn: '紫色', name_en: 'Purple', hex: '#7B1FA2' },
  { code: 'C18', name_cn: '深紫', name_en: 'Dark Purple', hex: '#4A148C' },
  { code: 'C19', name_cn: '蓝紫', name_en: 'Blue Violet', hex: '#5C6BC0' },
  { code: 'C20', name_cn: '浅蓝', name_en: 'Light Blue', hex: '#81D4FA' },
  { code: 'C21', name_cn: '天蓝', name_en: 'Sky Blue', hex: '#29B6F6' },
  { code: 'C22', name_cn: '蓝色', name_en: 'Blue', hex: '#1976D2' },
  { code: 'C23', name_cn: '深蓝', name_en: 'Dark Blue', hex: '#0D47A1' },
  { code: 'C24', name_cn: '海军蓝', name_en: 'Navy', hex: '#1A237E' },
  { code: 'C25', name_cn: '青色', name_en: 'Cyan', hex: '#00BCD4' },
  { code: 'C26', name_cn: '浅青', name_en: 'Light Cyan', hex: '#80DEEA' },
  { code: 'C27', name_cn: '水鸭蓝', name_en: 'Teal', hex: '#00897B' },
  { code: 'C28', name_cn: '薄荷绿', name_en: 'Mint', hex: '#A5D6A7' },
  { code: 'C29', name_cn: '浅绿', name_en: 'Light Green', hex: '#66BB6A' },
  { code: 'C30', name_cn: '绿色', name_en: 'Green', hex: '#388E3C' },
  { code: 'C31', name_cn: '深绿', name_en: 'Dark Green', hex: '#1B5E20' },
  { code: 'C32', name_cn: '黄绿', name_en: 'Yellow Green', hex: '#AEEA00' },
  { code: 'C33', name_cn: '草绿', name_en: 'Lime', hex: '#8BC34A' },
  { code: 'C34', name_cn: '橄榄绿', name_en: 'Olive', hex: '#827717' },
  { code: 'C35', name_cn: '军绿', name_en: 'Army Green', hex: '#558B2F' },
  { code: 'C36', name_cn: '棕色', name_en: 'Brown', hex: '#795548' },
  { code: 'C37', name_cn: '深棕', name_en: 'Dark Brown', hex: '#4E342E' },
  { code: 'C38', name_cn: '浅棕', name_en: 'Light Brown', hex: '#BCAAA4' },
  { code: 'C39', name_cn: '驼色', name_en: 'Tan', hex: '#D7CCC8' },
  { code: 'C40', name_cn: '肤色', name_en: 'Peach', hex: '#FFCCBC' },
  { code: 'C41', name_cn: '深肤', name_en: 'Skin', hex: '#FFAB91' },
  { code: 'C42', name_cn: '赭石', name_en: 'Sienna', hex: '#A1887F' },
  { code: 'C43', name_cn: '银色', name_en: 'Silver', hex: '#B0BEC5' },
  { code: 'C44', name_cn: '浅灰', name_en: 'Light Gray', hex: '#E0E0E0' },
  { code: 'C45', name_cn: '灰色', name_en: 'Gray', hex: '#9E9E9E' },
  { code: 'C46', name_cn: '深灰', name_en: 'Dark Gray', hex: '#616161' },
  { code: 'C47', name_cn: '炭灰', name_en: 'Charcoal', hex: '#424242' },
  { code: 'C48', name_cn: '黑色', name_en: 'Black', hex: '#212121' },
  { code: 'C49', name_cn: '荧光黄', name_en: 'Neon Yellow', hex: '#F4FF81' },
  { code: 'C50', name_cn: '荧光橙', name_en: 'Neon Orange', hex: '#FF9E40' },
  { code: 'C51', name_cn: '荧光粉', name_en: 'Neon Pink', hex: '#FF80AB' },
  { code: 'C52', name_cn: '荧光绿', name_en: 'Neon Green', hex: '#B9F6CA' },
  { code: 'C53', name_cn: '荧光蓝', name_en: 'Neon Blue', hex: '#80D8FF' },
  { code: 'C54', name_cn: '玫瑰金', name_en: 'Rose Gold', hex: '#EEC5B0' },
  { code: 'C55', name_cn: '古铜', name_en: 'Bronze', hex: '#A0522D' },
  { code: 'C56', name_cn: '卡其', name_en: 'Khaki', hex: '#C8B560' },
  { code: 'C57', name_cn: '米黄', name_en: 'Beige', hex: '#F5F5DC' },
  { code: 'C58', name_cn: '象牙白', name_en: 'Ivory', hex: '#FFFFF0' },
  { code: 'C59', name_cn: '浅紫红', name_en: 'Mauve', hex: '#E0B0FF' },
  { code: 'C60', name_cn: '砖红', name_en: 'Brick Red', hex: '#CB4154' },
  { code: 'C61', name_cn: '酒红', name_en: 'Burgundy', hex: '#800020' },
  { code: 'C62', name_cn: '靛蓝', name_en: 'Indigo', hex: '#3F51B5' },
  { code: 'C63', name_cn: '铁蓝', name_en: 'Steel Blue', hex: '#4682B4' },
  { code: 'C64', name_cn: '孔雀绿', name_en: 'Peacock', hex: '#00827F' },
  { code: 'C65', name_cn: '苔绿', name_en: 'Moss Green', hex: '#8A9A5B' },
  { code: 'C66', name_cn: '栗色', name_en: 'Chestnut', hex: '#954535' },
  { code: 'C67', name_cn: '沙色', name_en: 'Sand', hex: '#C2B280' },
  { code: 'C68', name_cn: '冰蓝', name_en: 'Ice Blue', hex: '#D6EAF8' },
  { code: 'C69', name_cn: '丁香紫', name_en: 'Lilac', hex: '#C8A2C8' },
  { code: 'C70', name_cn: '樱花粉', name_en: 'Sakura', hex: '#FFB7C5' },
  { code: 'C71', name_cn: '深橄榄', name_en: 'Dark Olive', hex: '#556B2F' },
  { code: 'C72', name_cn: '烟灰', name_en: 'Smoke Gray', hex: '#90A4AE' },
]

/** hex（大写）→ ColorEntry 的快速索引，供图例与色号反查使用 */
export const ARTKAL_BY_HEX: Map<string, ColorEntry> = new Map(
  ARTKAL_MIDI_PALETTE.map((c) => [c.hex.toUpperCase(), c]),
)

/** 按 hex 反查 Artkal 色号条目（大小写不敏感） */
export function findArtkalByHex(hex: string): ColorEntry | undefined {
  return ARTKAL_BY_HEX.get(hex.toUpperCase())
}
