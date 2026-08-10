import { X } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'default' | 'win98' | 'glitch';
}

export function GuideModal({ isOpen, onClose, theme = 'default' }: GuideModalProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  if (!isOpen) return null;

  const h3Class = `font-bold mb-2 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${
        isGlitch
          ? 'glitch-activity-card'
          : isWin98
          ? 'win98-activity-card'
          : 'bg-white border border-[#e5e6e7] shadow-lg'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl ${
            isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
          }`} style={{ fontFamily: 'Consolas, monospace' }}>
            📖 Taskmon Guide
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isGlitch
                ? 'glitch-button'
                : isWin98
                ? 'win98-button'
                : 'bg-[#f3f4f6] hover:bg-gray-200 text-[#4a5565]'
            }`}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className={`space-y-4 ${
          isGlitch ? 'text-[#00ff00]' : isWin98 ? 'text-black' : 'text-[#4d5461]'
        }`} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', lineHeight: '1.5' }}>

          <section>
            <h3 className={h3Class}>1. The 3 Profiles (Houses)</h3>
            <p>
              The <strong>3 little houses</strong> at the top are <strong>3 fully separate
              saves</strong> on the same install — each with its own pet, tasks, activities and
              progress. Tap a house to switch profiles; tap the active one to go home. Each
              profile has its own look: <strong>black &amp; purple</strong>, <strong>pink</strong> and
              <strong> green</strong>.
            </p>
          </section>

          <section>
            <h3 className={h3Class}>2. Evolution System</h3>
            <p className="mb-2">
              Your Taskmon evolves through <strong>perfect days</strong>.
              A day is perfect when you complete your <strong>daily goal</strong> — everything
              you registered, up to the phase requirement — AND your pet's
              <strong> energy is full at the end of the day</strong> (feed it!).
            </p>
            <p className="mb-2">
              Each pet has a single, linear line of <strong>3 phases</strong>:
              Egg → Phase 1 → Phase 2 → Phase 3 (final form). There are 3 pets, one per egg:
              <strong> Vix</strong> (purple), <strong>Momo</strong> (pink) and <strong>Kiwi</strong> (green).
            </p>
            <p>
              Don't want to evolve yet? On the <strong>Evolution page</strong>, tap your
              <strong> current pet</strong> to toggle a <strong>🔒 padlock</strong>: while
              locked it never evolves (perfect days still accumulate), and after unlocking it
              evolves at the <strong>next day turn</strong>. The <strong>🌀 Glitchtama</strong>
              (clear all 5 dungeon floors) grants a perfect day when used.
            </p>
          </section>

          <section>
            <h3 className={h3Class}>3. What Each Action Does</h3>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>❤️ Hearts (HP)</strong> — Lost in proportion to what you leave undone,
                measured against your phase's <strong>daily requirement</strong>: meet the
                requirement (or finish everything you registered) and you're safe. Uncleaned
                <strong> poop</strong> also drains <strong>1 heart every 6 hours</strong>.
                Hearts are healed by <strong>rubbing your pet</strong> (up to
                <strong> 1 heart per day</strong>) or by using a <strong>Little Heart</strong> item
                (a rare dungeon drop). If HP hits 0, your pet goes back a phase.
              </li>
              <li>
                <strong>⚡ Energy</strong> — The number of energy bars equals your phase's
                <strong> daily task requirement</strong> (e.g. Phase 2 needs 5 tasks → 5 bars).
                Fills only by <strong>feeding</strong> and resets daily. It must be
                <strong> full at the end of the day</strong> for the day to count as perfect.
              </li>
              <li>
                <strong>🍎 Food (Feed)</strong> — Refills energy (+1 per item).
                <strong> It does not heal hearts.</strong> You can feed up to
                <strong> 5 times per hour</strong>; once full, the pet just says it's full.
                You earn food by completing tasks and activities.
              </li>
              <li>
                <strong>🚿 Bath</strong> — Cleans up <strong>poop</strong> and washes your
                pet. Always available.
              </li>
              <li>
                <strong>🫶 Affection (Rub)</strong> — <strong>Rub your pet</strong> (press and
                drag over it) to make little hearts pop out. Every ~2 seconds of rubbing
                restores half a heart, up to <strong>1 full heart per day</strong>.
              </li>
              <li>
                <strong>💤 Sleep</strong> — Your pet rests. It won't poop while asleep,
                so sleeping through the night protects it from overnight penalties.
              </li>
            </ul>
          </section>

          <section>
            <h3 className={h3Class}>4. Requirements per Phase</h3>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Egg → Phase 1: 1 perfect day · 1 task/day · 1 heart</li>
              <li>Phase 1 → Phase 2: 3 perfect days · 3 tasks/day · 2 hearts</li>
              <li>Phase 2 → Phase 3: 5 perfect days · 5 tasks/day · 3 hearts</li>
              <li>Phase 3 (final): 6 tasks/day · 4 hearts</li>
            </ul>
            <p className="mt-2">
              A non-perfect day removes 1 accumulated perfect day (streak pressure!).
            </p>
          </section>

          <section>
            <h3 className={h3Class}>5. Weekday Selection</h3>
            <p className="mb-2">
              <strong>Before Phase 2</strong> (Egg and Phase 1):
              no weekday selection — all activities are considered daily.
            </p>
            <p>
              <strong>From Phase 2 onwards</strong>:
              you can choose which days of the week each activity is available.
              By default, all days are checked when creating an activity.
            </p>
          </section>

          <section>
            <h3 className={h3Class}>6. HP Details</h3>
            <p className="mb-2">
              At the end of each day you lose hearts <strong>in proportion to what you left undone</strong>,
              measured against min(registered, phase requirement):
              lost hearts = ⌊(1 − done/goal) × maxHearts⌋. Meeting the phase requirement — or finishing
              everything you registered — means <strong>no loss</strong>, and registering extra activities
              never adds risk.
            </p>
            <p>
              <strong>If HP reaches 0:</strong> your pet goes back to the previous phase.
              Climbing back is easier: you keep a head start of half the perfect days
              needed for that phase. This discount doesn't stack — it's always half
              again if it happens a second time.
            </p>
          </section>

          <section>
            <h3 className={h3Class}>7. Minigames, Bits &amp; Shop</h3>
            <p>
              The Activities page has minigames (Dungeon, Dino Runner, Roof Run,
              Rock-Paper-Scissors, Bubble Pop, Flower Catch) that award <strong>Bits</strong> — spend them in the shop on
              <strong> food</strong> for your pet. The Dungeon is free to play —
              losing costs no real heart.
            </p>
          </section>

          <section className="border-t pt-4 mt-4" style={{ borderColor: isGlitch ? '#00ffff' : isWin98 ? '#000080' : '#e5e6e7' }}>
            <p className="text-center italic">
              Tip: Focus on completing 100% of daily tasks to evolve faster and keep your Taskmon strong! 💪
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
