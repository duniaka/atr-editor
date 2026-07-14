import { AtrEditor } from '@/components/atr/AtrEditor'

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page intro */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground text-balance">
            Answer-to-Reset Editor
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed text-pretty max-w-2xl">
            Edit ATR byte sequences interactively. Paste or type a hex string above and the
            field editors will update automatically — or edit individual fields and watch the
            hex string rebuild with live TCK checksum recalculation.
          </p>

          {/* Quick examples */}
          <div className="flex flex-wrap gap-2 mt-4">
            {EXAMPLES.map(ex => (
              <ExampleChip key={ex.label} {...ex} />
            ))}
          </div>
        </div>

        <AtrEditor />
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Example ATR chips (client component for onClick)
// ---------------------------------------------------------------------------
import { ExampleAtrChip } from '@/components/atr/ExampleAtrChip'

const EXAMPLES = [
  { label: 'Minimal T=0', hex: '3B 00' },
  { label: 'Direct + TA1', hex: '3B 10 94' },
  { label: 'T=1 with TCK', hex: '3B 90 11 00 81' },
  { label: 'EMV-like', hex: '3B 6B 00 00 00 31 80 65 B0 03 01 01 01 81 05 89' },
  { label: 'T=1 IFSC/BWI (TA3/TB3)', hex: '3B EF 00 FF 81 31 FE 45 65 63 11 15 62 02 50 00 10 0A 00 2E FC 07 20 C6' },
]

function ExampleChip({ label, hex }: { label: string; hex: string }) {
  return <ExampleAtrChip label={label} hex={hex} />
}
