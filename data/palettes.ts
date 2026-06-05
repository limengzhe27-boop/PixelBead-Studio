// PixelBead Studio — 品牌调色板数据
// 数据来源：
//   Mard 221 色（2.6mm）— 已与竞品图纸核对一致
//   Artkal-S 159 色（5mm）— Artkal 官方 S 系列
// 注意：不同品牌豆子尺寸不同，beadSizeMm 用于实物尺寸/拼盘计算。
//   Mard 尺寸按通用迷你豆 2.6mm 设定（如需精确请再核对）；Artkal-S 来源明确为 5mm。
 
export interface BeadColor {
    code: string; // 完整色号，如 "A18"、"S01"
    hex: string;  // 如 "#FEBE7D"
  }
   
  export interface BeadPalette {
    id: string;          // 唯一标识
    name: string;        // 显示名
    beadSizeMm: number;  // 单颗直径(mm)，用于实物尺寸与拼盘计算
    colors: BeadColor[];
  }
   
  // ============ Mard 221 色（2.6mm）============
  export const MARD_PALETTE: BeadPalette = {
    id: 'mard',
    name: 'Mard 221 (2.6mm)',
    beadSizeMm: 2.6,
    colors: [
      // A 系 黄橙系 (26)
      { code: 'A1', hex: '#FAF4C8' }, { code: 'A2', hex: '#FFFFD5' }, { code: 'A3', hex: '#FEFF8B' },
      { code: 'A4', hex: '#FBED56' }, { code: 'A5', hex: '#F4D738' }, { code: 'A6', hex: '#FEAC4C' },
      { code: 'A7', hex: '#FE8B4C' }, { code: 'A8', hex: '#FFDA45' }, { code: 'A9', hex: '#FF995B' },
      { code: 'A10', hex: '#F77C31' }, { code: 'A11', hex: '#FFDD99' }, { code: 'A12', hex: '#FE9F72' },
      { code: 'A13', hex: '#FFC365' }, { code: 'A14', hex: '#FD543D' }, { code: 'A15', hex: '#FFF365' },
      { code: 'A16', hex: '#FFFF9F' }, { code: 'A17', hex: '#FFE36E' }, { code: 'A18', hex: '#FEBE7D' },
      { code: 'A19', hex: '#FD7C72' }, { code: 'A20', hex: '#FFD568' }, { code: 'A21', hex: '#FFE395' },
      { code: 'A22', hex: '#F4F57D' }, { code: 'A23', hex: '#E6C9B7' }, { code: 'A24', hex: '#F7F8A2' },
      { code: 'A25', hex: '#FFD67D' }, { code: 'A26', hex: '#FFC830' },
      // B 系 绿色系 (32)
      { code: 'B1', hex: '#E6EE31' }, { code: 'B2', hex: '#63F347' }, { code: 'B3', hex: '#9EF780' },
      { code: 'B4', hex: '#5DE035' }, { code: 'B5', hex: '#35E352' }, { code: 'B6', hex: '#65E2A6' },
      { code: 'B7', hex: '#3DAF80' }, { code: 'B8', hex: '#1C9C4F' }, { code: 'B9', hex: '#27523A' },
      { code: 'B10', hex: '#95D3C2' }, { code: 'B11', hex: '#5D722A' }, { code: 'B12', hex: '#166F41' },
      { code: 'B13', hex: '#CAEB7B' }, { code: 'B14', hex: '#ADE946' }, { code: 'B15', hex: '#2E5132' },
      { code: 'B16', hex: '#C5ED9C' }, { code: 'B17', hex: '#9BB13A' }, { code: 'B18', hex: '#E6EE49' },
      { code: 'B19', hex: '#24B88C' }, { code: 'B20', hex: '#C2F0CC' }, { code: 'B21', hex: '#156A6B' },
      { code: 'B22', hex: '#0B3C43' }, { code: 'B23', hex: '#303A21' }, { code: 'B24', hex: '#EEFCA5' },
      { code: 'B25', hex: '#4E846D' }, { code: 'B26', hex: '#8D7A35' }, { code: 'B27', hex: '#CCE1AF' },
      { code: 'B28', hex: '#9EE5B9' }, { code: 'B29', hex: '#C5E254' }, { code: 'B30', hex: '#E2FCB1' },
      { code: 'B31', hex: '#B0E792' }, { code: 'B32', hex: '#9CAB5A' },
      // C 系 蓝青系 (29)
      { code: 'C1', hex: '#E8FFE7' }, { code: 'C2', hex: '#A9F9FC' }, { code: 'C3', hex: '#A0E2FB' },
      { code: 'C4', hex: '#41CCFF' }, { code: 'C5', hex: '#01ACEB' }, { code: 'C6', hex: '#50AAF0' },
      { code: 'C7', hex: '#3677D2' }, { code: 'C8', hex: '#0F54C0' }, { code: 'C9', hex: '#324BCA' },
      { code: 'C10', hex: '#3EBCE2' }, { code: 'C11', hex: '#28DDDE' }, { code: 'C12', hex: '#1C334D' },
      { code: 'C13', hex: '#CDE8FF' }, { code: 'C14', hex: '#D5FDFF' }, { code: 'C15', hex: '#22C4C6' },
      { code: 'C16', hex: '#1557A8' }, { code: 'C17', hex: '#04D1F6' }, { code: 'C18', hex: '#1D3344' },
      { code: 'C19', hex: '#1887A2' }, { code: 'C20', hex: '#176DAF' }, { code: 'C21', hex: '#BEDDFF' },
      { code: 'C22', hex: '#67B4BE' }, { code: 'C23', hex: '#C8E2FF' }, { code: 'C24', hex: '#7CC4FF' },
      { code: 'C25', hex: '#A9E5E5' }, { code: 'C26', hex: '#3CAED8' }, { code: 'C27', hex: '#D3DFFA' },
      { code: 'C28', hex: '#BBCFED' }, { code: 'C29', hex: '#34488E' },
      // D 系 蓝紫系 (26)
      { code: 'D1', hex: '#AEB4F2' }, { code: 'D2', hex: '#858EDD' }, { code: 'D3', hex: '#2F54AF' },
      { code: 'D4', hex: '#182A84' }, { code: 'D5', hex: '#B843C5' }, { code: 'D6', hex: '#AC7BDE' },
      { code: 'D7', hex: '#8854B3' }, { code: 'D8', hex: '#E2D3FF' }, { code: 'D9', hex: '#D5B9F8' },
      { code: 'D10', hex: '#361851' }, { code: 'D11', hex: '#B9BAE1' }, { code: 'D12', hex: '#DE9AD4' },
      { code: 'D13', hex: '#B90095' }, { code: 'D14', hex: '#8B279B' }, { code: 'D15', hex: '#2F1F90' },
      { code: 'D16', hex: '#E3E1EE' }, { code: 'D17', hex: '#C4D4F6' }, { code: 'D18', hex: '#A45EC7' },
      { code: 'D19', hex: '#D8C3D7' }, { code: 'D20', hex: '#9C32B2' }, { code: 'D21', hex: '#9A009B' },
      { code: 'D22', hex: '#333A95' }, { code: 'D23', hex: '#EBDAFC' }, { code: 'D24', hex: '#7786E5' },
      { code: 'D25', hex: '#494FC7' }, { code: 'D26', hex: '#DFC2F8' },
      // E 系 粉玫系 (24)
      { code: 'E1', hex: '#FDD3CC' }, { code: 'E2', hex: '#FEC0DF' }, { code: 'E3', hex: '#FFB7E7' },
      { code: 'E4', hex: '#E8649E' }, { code: 'E5', hex: '#F551A2' }, { code: 'E6', hex: '#F13D74' },
      { code: 'E7', hex: '#C63478' }, { code: 'E8', hex: '#FFDBE9' }, { code: 'E9', hex: '#E970CC' },
      { code: 'E10', hex: '#D33793' }, { code: 'E11', hex: '#FCDDD2' }, { code: 'E12', hex: '#F78FC3' },
      { code: 'E13', hex: '#B5006D' }, { code: 'E14', hex: '#FFD1BA' }, { code: 'E15', hex: '#F8C7C9' },
      { code: 'E16', hex: '#FFF3EB' }, { code: 'E17', hex: '#FFE2EA' }, { code: 'E18', hex: '#FFC7DB' },
      { code: 'E19', hex: '#FEBAD5' }, { code: 'E20', hex: '#D8C7D1' }, { code: 'E21', hex: '#BD9DA1' },
      { code: 'E22', hex: '#B785A1' }, { code: 'E23', hex: '#937A8D' }, { code: 'E24', hex: '#E1BCE8' },
      // F 系 红色系 (25)
      { code: 'F1', hex: '#FD957B' }, { code: 'F2', hex: '#FC3D46' }, { code: 'F3', hex: '#F74941' },
      { code: 'F4', hex: '#FC283C' }, { code: 'F5', hex: '#E7002F' }, { code: 'F6', hex: '#943630' },
      { code: 'F7', hex: '#971937' }, { code: 'F8', hex: '#BC0028' }, { code: 'F9', hex: '#E2677A' },
      { code: 'F10', hex: '#8A4526' }, { code: 'F11', hex: '#5A2121' }, { code: 'F12', hex: '#FD4E6A' },
      { code: 'F13', hex: '#F35744' }, { code: 'F14', hex: '#FFA9AD' }, { code: 'F15', hex: '#D30022' },
      { code: 'F16', hex: '#FEC2A6' }, { code: 'F17', hex: '#E69C79' }, { code: 'F18', hex: '#D37C46' },
      { code: 'F19', hex: '#C1444A' }, { code: 'F20', hex: '#CD9391' }, { code: 'F21', hex: '#F7B4C6' },
      { code: 'F22', hex: '#FDC0D0' }, { code: 'F23', hex: '#F67E66' }, { code: 'F24', hex: '#E698AA' },
      { code: 'F25', hex: '#E54B4F' },
      // G 系 棕肤系 (21)
      { code: 'G1', hex: '#FFE2CE' }, { code: 'G2', hex: '#FFC4AA' }, { code: 'G3', hex: '#F4C3A5' },
      { code: 'G4', hex: '#E1B383' }, { code: 'G5', hex: '#EDB045' }, { code: 'G6', hex: '#E99C17' },
      { code: 'G7', hex: '#9D5B3E' }, { code: 'G8', hex: '#753832' }, { code: 'G9', hex: '#E6B483' },
      { code: 'G10', hex: '#D98C39' }, { code: 'G11', hex: '#E0C593' }, { code: 'G12', hex: '#FFC890' },
      { code: 'G13', hex: '#B7714A' }, { code: 'G14', hex: '#8D614C' }, { code: 'G15', hex: '#FCF9E0' },
      { code: 'G16', hex: '#F2D9BA' }, { code: 'G17', hex: '#78524B' }, { code: 'G18', hex: '#FFE4CC' },
      { code: 'G19', hex: '#E07935' }, { code: 'G20', hex: '#A94023' }, { code: 'G21', hex: '#B88558' },
      // H 系 黑白系 (23)
      { code: 'H1', hex: '#FDFBFF' }, { code: 'H2', hex: '#FEFFFF' }, { code: 'H3', hex: '#B6B1BA' },
      { code: 'H4', hex: '#89858C' }, { code: 'H5', hex: '#48464E' }, { code: 'H6', hex: '#2F2B2F' },
      { code: 'H7', hex: '#000000' }, { code: 'H8', hex: '#E7D6DB' }, { code: 'H9', hex: '#EDEDED' },
      { code: 'H10', hex: '#EEE9EA' }, { code: 'H11', hex: '#CECDD5' }, { code: 'H12', hex: '#FFF5ED' },
      { code: 'H13', hex: '#F5ECD2' }, { code: 'H14', hex: '#CFD7D3' }, { code: 'H15', hex: '#98A6A8' },
      { code: 'H16', hex: '#1D1414' }, { code: 'H17', hex: '#F1EDED' }, { code: 'H18', hex: '#FFFDF0' },
      { code: 'H19', hex: '#F6EFE2' }, { code: 'H20', hex: '#949FA3' }, { code: 'H21', hex: '#FFFBE1' },
      { code: 'H22', hex: '#CACAD4' }, { code: 'H23', hex: '#9A9D94' },
      // M 系 大地系 (15)
      { code: 'M1', hex: '#BCC6B8' }, { code: 'M2', hex: '#8AA386' }, { code: 'M3', hex: '#697D80' },
      { code: 'M4', hex: '#E3D2BC' }, { code: 'M5', hex: '#D0CCAA' }, { code: 'M6', hex: '#B0A782' },
      { code: 'M7', hex: '#B4A497' }, { code: 'M8', hex: '#B38281' }, { code: 'M9', hex: '#A58767' },
      { code: 'M10', hex: '#C5B2BC' }, { code: 'M11', hex: '#9F7594' }, { code: 'M12', hex: '#644749' },
      { code: 'M13', hex: '#D19066' }, { code: 'M14', hex: '#C77362' }, { code: 'M15', hex: '#757D78' },
    ],
  };
   
  // ============ Artkal-S 159 色（5mm）============
  export const ARTKAL_S_PALETTE: BeadPalette = {
    id: 'artkal-s',
    name: 'Artkal-S (5mm)',
    beadSizeMm: 5.0,
    colors: [
      { code: 'S01', hex: '#FFFFFF' }, { code: 'S77', hex: '#EFEFEF' }, { code: 'S78', hex: '#D1D1D1' },
      { code: 'S79', hex: '#BBBCBC' }, { code: 'S07', hex: '#9B9B9B' }, { code: 'S43', hex: '#767777' },
      { code: 'S89', hex: '#484949' }, { code: 'S69', hex: '#23282B' }, { code: 'S13', hex: '#000000' },
      { code: 'S42', hex: '#A09F9D' }, { code: 'S41', hex: '#9A5516' }, { code: 'S63', hex: '#4C5914' },
      { code: 'S52', hex: '#F2F0A1' }, { code: 'S29', hex: '#F6EB61' }, { code: 'S14', hex: '#FAE053' },
      { code: 'S27', hex: '#FFD100' }, { code: 'S48', hex: '#FFC72C' }, { code: 'S86', hex: '#EAAA00' },
      { code: 'S90', hex: '#FFC56E' }, { code: 'S03', hex: '#F6AD4C' }, { code: 'S39', hex: '#ED8B00' },
      { code: 'S56', hex: '#FF6A13' }, { code: 'S04', hex: '#FF671F' }, { code: 'S66', hex: '#F4633A' },
      { code: 'S87', hex: '#FF6D6A' }, { code: 'S02', hex: '#FFA38B' }, { code: 'S50', hex: '#FAAA8D' },
      { code: 'S35', hex: '#F7CED7' }, { code: 'S28', hex: '#EAB8E4' }, { code: 'S40', hex: '#F1A7DC' },
      { code: 'S06', hex: '#EC86D0' }, { code: 'S25', hex: '#FF34B3' }, { code: 'S26', hex: '#DB2152' },
      { code: 'S05', hex: '#E10600' }, { code: 'S34', hex: '#BA0C2F' }, { code: 'S58', hex: '#A50034' },
      { code: 'S38', hex: '#AB2556' }, { code: 'S49', hex: '#72195F' }, { code: 'S88', hex: '#DA1884' },
      { code: 'S67', hex: '#F3CFB3' }, { code: 'S18', hex: '#CC9966' }, { code: 'S65', hex: '#F3EA5D' },
      { code: 'S46', hex: '#73D33C' }, { code: 'S08', hex: '#24DE5B' }, { code: 'S61', hex: '#CEDC00' },
      { code: 'S70', hex: '#9BBC11' }, { code: 'S80', hex: '#999B30' }, { code: 'S55', hex: '#ADDC91' },
      { code: 'S21', hex: '#87D839' }, { code: 'S20', hex: '#249E6B' }, { code: 'S71', hex: '#00852B' },
      { code: 'S62', hex: '#007C58' }, { code: 'S09', hex: '#00685E' }, { code: 'S91', hex: '#183028' },
      { code: 'S33', hex: '#C5B4E3' }, { code: 'S60', hex: '#A77BCA' }, { code: 'S12', hex: '#A05EB5' },
      { code: 'S23', hex: '#64359B' }, { code: 'S59', hex: '#4A1F87' }, { code: 'S22', hex: '#330072' },
      { code: 'S64', hex: '#050849' }, { code: 'S44', hex: '#8DC8E8' }, { code: 'S10', hex: '#41B6E6' },
      { code: 'S53', hex: '#69B3E7' }, { code: 'S54', hex: '#0090DA' }, { code: 'S24', hex: '#147BD1' },
      { code: 'S11', hex: '#003399' }, { code: 'S30', hex: '#99D6EA' }, { code: 'S31', hex: '#9EE5B0' },
      { code: 'S37', hex: '#71D8BF' }, { code: 'S72', hex: '#59D5D8' }, { code: 'S45', hex: '#00B2A9' },
      { code: 'S76', hex: '#00AEC7' }, { code: 'S73', hex: '#48A9C5' }, { code: 'S74', hex: '#00AED6' },
      { code: 'S75', hex: '#0085AD' }, { code: 'S84', hex: '#AA5761' }, { code: 'S36', hex: '#C9809E' },
      { code: 'S19', hex: '#FCBFA9' }, { code: 'S51', hex: '#FCFBCD' }, { code: 'S32', hex: '#FFE780' },
      { code: 'S68', hex: '#E1C078' }, { code: 'S81', hex: '#CDB277' }, { code: 'S82', hex: '#B58150' },
      { code: 'S17', hex: '#7B4D35' }, { code: 'S16', hex: '#5C4738' }, { code: 'S85', hex: '#42031A' },
      { code: 'S15', hex: '#793E2C' }, { code: 'S57', hex: '#A4493D' }, { code: 'S83', hex: '#B86125' },
      { code: 'S47', hex: '#B47E00' }, { code: 'S92', hex: '#DEB947' }, { code: 'S93', hex: '#DAB698' },
      { code: 'S94', hex: '#F4A999' }, { code: 'S95', hex: '#EE7D67' }, { code: 'S96', hex: '#F08661' },
      { code: 'S97', hex: '#D4722A' }, { code: 'S98', hex: '#64ACDF' }, { code: 'S99', hex: '#64C2DC' },
      { code: 'S100', hex: '#4F9FB3' }, { code: 'S101', hex: '#3196DD' }, { code: 'S102', hex: '#1B6CB6' },
      { code: 'S103', hex: '#083980' }, { code: 'S104', hex: '#0A668B' }, { code: 'S105', hex: '#085B6E' },
      { code: 'S106', hex: '#004E78' }, { code: 'S107', hex: '#005574' }, { code: 'S108', hex: '#CCBE80' },
      { code: 'S109', hex: '#A49350' }, { code: 'S110', hex: '#9E883C' }, { code: 'S111', hex: '#766C2B' },
      { code: 'S112', hex: '#795F26' }, { code: 'S113', hex: '#BAB8A2' }, { code: 'S114', hex: '#728C54' },
      { code: 'S115', hex: '#7E7C44' }, { code: 'S116', hex: '#64692E' }, { code: 'S117', hex: '#4E582C' },
      { code: 'S118', hex: '#4A5E2D' }, { code: 'S119', hex: '#71C452' }, { code: 'S120', hex: '#66CC99' },
      { code: 'S121', hex: '#569A83' }, { code: 'S122', hex: '#14C25B' }, { code: 'S123', hex: '#18A818' },
      { code: 'S124', hex: '#04552E' }, { code: 'S125', hex: '#136B5A' }, { code: 'S126', hex: '#054641' },
      { code: 'S127', hex: '#D9B6D6' }, { code: 'S128', hex: '#AD62A4' }, { code: 'S129', hex: '#E68CA3' },
      { code: 'S130', hex: '#DE5479' }, { code: 'S131', hex: '#9E82BA' }, { code: 'S132', hex: '#E8416B' },
      { code: 'S133', hex: '#B7388F' }, { code: 'S134', hex: '#581F7E' }, { code: 'S135', hex: '#8CA3D4' },
      { code: 'S136', hex: '#9A9ACC' }, { code: 'S137', hex: '#5981C1' }, { code: 'S138', hex: '#4166B0' },
      { code: 'S139', hex: '#475FAB' }, { code: 'S140', hex: '#374593' }, { code: 'S141', hex: '#3D56A5' },
      { code: 'S142', hex: '#294299' }, { code: 'S143', hex: '#25268A' }, { code: 'S144', hex: '#1A2F6F' },
      { code: 'S145', hex: '#D3C95D' }, { code: 'S146', hex: '#510918' }, { code: 'S147', hex: '#64B39E' },
      { code: 'S148', hex: '#634338' }, { code: 'S149', hex: '#EDD39E' }, { code: 'S150', hex: '#6963AB' },
      { code: 'S151', hex: '#2B3F1F' }, { code: 'S152', hex: '#9791C5' }, { code: 'S153', hex: '#B8BDE0' },
      { code: 'S154', hex: '#F9C898' }, { code: 'S155', hex: '#C39069' }, { code: 'S156', hex: '#44505B' },
      { code: 'S157', hex: '#3E4955' }, { code: 'S158', hex: '#202830' }, { code: 'S159', hex: '#888B8D' },
    ],
  };
   
  // ============ 导出 ============
  export const PALETTES: BeadPalette[] = [MARD_PALETTE, ARTKAL_S_PALETTE];
  export const DEFAULT_PALETTE_ID = 'mard';
   
  export function getPaletteById(id: string): BeadPalette {
    return PALETTES.find(p => p.id === id) ?? MARD_PALETTE;
  }
  