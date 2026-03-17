const BADGE_URL = 'https://platform.fatsecret.com/api/static/images/powered_by_fatsecret_horizontal_brand.svg'

export default function FatSecretAttribution({ className }: { className?: string }) {
  return (
    <a
      href="https://platform.fatsecret.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block ${className ?? ''}`}
    >
      <img
        src={BADGE_URL}
        alt="Powered by FatSecret Platform API"
        className="h-5"
        loading="lazy"
      />
    </a>
  )
}
