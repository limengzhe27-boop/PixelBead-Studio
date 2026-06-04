/** 品牌标识：黑墨描边的贴纸拼豆图标 + 字标，多页复用 */
export default function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <span className="grid h-9 w-9 place-items-center rounded-[10px] border-2 border-ink bg-coral shadow-sticker-sm">
        <span className="block h-4 w-4 rounded-full border-[3px] border-white" />
      </span>
      {!compact && (
        <span className="font-display text-[20px] font-extrabold tracking-tight text-ink">
          PixelBead<span className="text-coral">·</span>Studio
        </span>
      )}
    </div>
  )
}
