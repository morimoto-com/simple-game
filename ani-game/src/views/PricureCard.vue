<template>
  <div class="memory-game" :class="{ won: isWon }" role="application" aria-label="神経衰弱ゲーム">
    <header class="hud">
      <div class="hud-item" aria-live="polite" aria-atomic="true">
        <span class="label">TIME</span>
        <span class="value">{{ formattedTime }}</span>
      </div>
      <div class="hud-item" aria-live="polite" aria-atomic="true">
        <span class="label">MOVES</span>
        <span class="value">{{ moves }}</span>
      </div>
      <div class="hud-item" aria-live="polite" aria-atomic="true">
        <span class="label">BEST</span>
        <span class="value">{{ bestText }}</span>
      </div>

      <!-- キャラ切替ボタン -->
      <div class="hud-item" role="group" aria-label="キャラクターセット切替">
        <button
          class="btn"
          :disabled="isResetting || currentSet === 'precure'"
          :aria-pressed="currentSet === 'precure'"
          @click="switchSet('precure')"
          title="プリキュアに切り替え"
        >
          プリキュア
        </button>
        <button
          class="btn"
          :disabled="isResetting || currentSet === 'aipuri'"
          :aria-pressed="currentSet === 'aipuri'"
          @click="switchSet('aipuri')"
          title="アイプリに切り替え"
        >
          アイプリ
        </button>
      </div>

      <button class="btn" @click="resetGame" :disabled="isResetting" title="リセット">
        ↻ Reset
      </button>
    </header>

    <main class="board" :style="boardStyle">
      <div
        v-for="card in cards"
        :key="card.uid"
        class="card"
        :class="{ flipped: card.flipped || card.matched, matched: card.matched, shake: card.shake }"
        role="button"
        tabindex="0"
        :aria-pressed="card.flipped || card.matched"
        @click="onCardClick(card)"
        @keyup.enter.space="onCardClick(card)"
      >
        <div class="inner">
          <div class="face front" aria-hidden="true">?</div>
          <div class="face back">
            <img v-if="card.image" :src="card.image" :alt="card.label" />
            <div v-else class="ph" :style="placeholderStyle(card.label)">
              <span class="ph-text">{{ initials(card.label) }}</span>
            </div>
          </div>
          <!-- マッチ演出のバースト -->
          <div v-if="card.burst" class="burst" aria-hidden="true"></div>
        </div>
      </div>
    </main>

    <transition name="win">
      <div v-if="isWon" class="win-overlay" role="dialog" aria-modal="true">
        <div class="win-card">
          <h2>🎉 CLEAR!</h2>
          <p>
            Time: <strong>{{ formattedTime }}</strong> / Moves: <strong>{{ moves }}</strong>
          </p>
          <button class="btn primary" @click="resetGame">もう一度</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
const PREVIEW_MS = 1500 // リセット直後に全カードを表にする時間（ms）

type Card = {
  uid: string
  key: string
  label: string
  image?: string
  flipped: boolean
  matched: boolean
  shake?: boolean
  burst?: boolean
}

type CharacterSet = 'precure' | 'aipuri'

/**
 * 公開プロパティ
 * images: キャラクター画像 URL を8件（順不同）
 * labels: 画像が無い場合の表示名を8件（例: 主人公名）
 * size: 盤面サイズ（固定 4x4 だが、余白調整に使用可能）
 */
const props = withDefaults(
  defineProps<{
    images?: string[]
    labels?: string[]
    size?: number
  }>(),
  {
    size: 4,
  },
)

/** 内蔵プリセット */
const characterSets: Record<CharacterSet, { images: string[]; labels: string[] }> = {
  precure: {
    images: [
      '/assets/precure/aidle.jpeg',
      '/assets/precure/kiss.jpeg',
      '/assets/precure/kyunkyun.jpeg',
      '/assets/precure/logo.jpeg',
      '/assets/precure/meruro.jpeg',
      '/assets/precure/purirun.jpeg',
      '/assets/precure/wink.jpeg',
      '/assets/precure/zukyun.jpeg',
    ],
    labels: [
      'アイドル',
      'キッス',
      'キュンキュン',
      'ロゴ',
      'メルロ',
      'プリルン',
      'ウィンク',
      'ズキュン',
    ],
  },
  aipuri: {
    images: [
      '/assets/aipri/bibi.jpeg',
      '/assets/aipri/chi.jpeg',
      '/assets/aipri/crober.jpeg',
      '/assets/aipri/himari.jpeg',
      '/assets/aipri/juria.jpeg',
      '/assets/aipri/mituki.jpeg',
      '/assets/aipri/subaru.jpeg',
      '/assets/aipri/tumugi.jpeg',
    ],
    labels: ['ビビ', 'チー', 'クローバー', 'ひまり', 'じゅりあ', 'みつき', 'すばる', 'つむぎ'],
  },
}

const currentSet = ref<CharacterSet>('precure')

/** props > 内蔵セット の順で採用。将来外部から差し替えてもOK */
const labels = computed(() => props.labels?.slice(0, 8) ?? characterSets[currentSet.value].labels)
const images = computed(() => props.images?.slice(0, 8) ?? characterSets[currentSet.value].images)

const cards = reactive<Card[]>([])
const moves = ref(0)
const isWon = ref(false)
const isResetting = ref(false)

// タイマー
const seconds = ref(0)
let timerId: number | null = null
const running = ref(false)

const boardStyle = computed(() => ({
  '--cols': String(props.size),
})) as unknown as Record<string, string>

function initials(label: string) {
  return (label ?? '').slice(0, 2)
}

function placeholderStyle(label: string) {
  let hash = 0
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) >>> 0
  const hue = hash % 360
  return {
    background: `linear-gradient(135deg, hsl(${hue} 80% 65%), hsl(${(hue + 40) % 360} 80% 55%))`,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function newDeck(): Card[] {
  const base: { key: string; label: string; image?: string }[] = []
  for (let i = 0; i < 8; i++) {
    base.push({ key: `k${i}`, label: labels.value[i], image: images.value?.[i] })
  }
  const doubled = base.flatMap((b) => [
    { ...b, uid: `${b.key}-A` },
    { ...b, uid: `${b.key}-B` },
  ])
  const deck = shuffle(doubled).map((c) => ({ ...c, flipped: false, matched: false }))
  return deck as Card[]
}

const openBuffer = reactive<Card[]>([])

function onCardClick(card: Card) {
  if (isWon.value || isResetting.value) return
  if (card.flipped || card.matched) return
  if (openBuffer.length === 2) return

  if (!running.value) startTimer()

  card.flipped = true
  openBuffer.push(card)

  if (openBuffer.length === 2) {
    moves.value++
    const [a, b] = openBuffer
    if (a.key === b.key) {
      setTimeout(() => {
        a.matched = b.matched = true
        // マッチ演出: バースト + ポップ
        a.burst = b.burst = true
        setTimeout(() => {
          a.burst = b.burst = false
        }, 650)
        openBuffer.length = 0
        checkWin()
      }, 250)
    } else {
      a.shake = b.shake = true
      setTimeout(() => {
        a.shake = b.shake = false
        a.flipped = b.flipped = false
        openBuffer.length = 0
      }, 700)
    }
  }
}

function checkWin() {
  if (cards.every((c) => c.matched)) {
    isWon.value = true
    stopTimer()
    saveBest()
  }
}

function resetGame() {
  isResetting.value = true
  stopTimer(true)
  seconds.value = 0
  moves.value = 0
  isWon.value = false
  openBuffer.length = 0

  const deck = newDeck()
  cards.splice(0, cards.length, ...deck)

  // お手本オープン（描画 → 次フレームで全開 → PREVIEW_MS 後に閉）
  nextTick(() => {
    requestAnimationFrame(() => {
      cards.forEach((c) => {
        c.flipped = true
        c.matched = false
        c.shake = false
        c.burst = false
      })
      setTimeout(() => {
        cards.forEach((c) => {
          c.flipped = false
        })
        requestAnimationFrame(() => {
          isResetting.value = false
        })
      }, PREVIEW_MS)
    })
  })
}

function startTimer() {
  running.value = true
  timerId = window.setInterval(() => {
    seconds.value++
  }, 1000)
}

function stopTimer(_skipFreeze = false) {
  running.value = false
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

const formattedTime = computed(() => {
  const m = Math.floor(seconds.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

/** セット別ベストを保存するキー */
const bestStorageKey = computed(() => `idol-memory-best-${currentSet.value}`)

const bestText = computed(() => {
  const best = loadBest()
  if (!best) return '—'
  const m = Math.floor(best.time / 60)
    .toString()
    .padStart(2, '0')
  const s = (best.time % 60).toString().padStart(2, '0')
  return `${m}:${s} / ${best.moves}`
})

function loadBest(): { time: number; moves: number } | null {
  try {
    const raw = localStorage.getItem(bestStorageKey.value)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveBest() {
  const best = loadBest()
  if (
    !best ||
    seconds.value < best.time ||
    (seconds.value === best.time && moves.value < best.moves)
  ) {
    localStorage.setItem(
      bestStorageKey.value,
      JSON.stringify({ time: seconds.value, moves: moves.value }),
    )
  }
}

/** セット切替（watcher が resetGame を実行） */
function switchSet(set: CharacterSet) {
  if (currentSet.value === set) return
  currentSet.value = set
}

onMounted(() => {
  resetGame()
})

/** セット変更や外部 props 差し替えでデッキを作り直す */
watch([images, labels], () => {
  resetGame()
})
</script>

<style scoped>
:root {
  --gap: 8px;
}
.memory-game {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  padding: 10px;
  box-sizing: border-box;
}
.hud {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  align-items: center;
  gap: 8px;
}
.hud-item {
  display: grid;
  justify-items: center;
  padding: 6px 8px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
}
.hud-item .label {
  font-size: 11px;
  opacity: 0.8;
  letter-spacing: 0.08em;
}
.hud-item .value {
  font-weight: 700;
  font-size: 16px;
}
.btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: #334155;
  color: #e2e8f0;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}
.btn[aria-pressed='true'] {
  outline: 2px solid #60a5fa;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn.primary {
  background: #2563eb;
  color: white;
}

/* ボードを正方形に保ちつつ、画面に収める。 */
.board {
  --cols: 4;
  --boardSize: min(100vw - 24px, 100vh - 200px);
  width: var(--boardSize);
  height: var(--boardSize);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: var(--gap);
  perspective: 900px;
}

.card {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  user-select: none;
  transform-style: preserve-3d;
}
.card .inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.2, 0.6, 0.2, 1);
}
.card.flipped .inner,
.card.matched .inner {
  transform: rotateY(180deg);
}
.card.shake .inner {
  animation: shake 0.35s ease both;
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.front {
  background: linear-gradient(135deg, #1f2937, #0f172a);
  color: #93c5fd;
  font-weight: 800;
  font-size: clamp(12px, 4vw, 20px);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.2),
    inset 0 0 0 2px rgba(255, 255, 255, 0.06);
}
.back {
  transform: rotateY(180deg);
  background: #0b1022;
  box-shadow:
    0 8px 18px rgba(0, 0, 0, 0.24),
    inset 0 0 0 2px rgba(255, 255, 255, 0.06);
}
.back img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
.ph-text {
  color: white;
  font-weight: 900;
  font-size: clamp(14px, 5vw, 22px);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.memory-game.won .board {
  animation: board-pop 0.6s ease both;
}
@keyframes board-pop {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.02);
  }
  60% {
    transform: scale(0.995);
  }
  100% {
    transform: scale(1);
  }
}

.win-enter-active,
.win-leave-active {
  transition: opacity 0.25s ease;
}
.win-enter-from,
.win-leave-to {
  opacity: 0;
}
.win-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 8, 18, 0.6);
  display: grid;
  place-items: center;
  backdrop-filter: blur(2px);
}
.win-card {
  background: #111827;
  color: #e5e7eb;
  padding: 18px 14px;
  border-radius: 12px;
  text-align: center;
}
.win-card h2 {
  margin: 0 0 8px;
  font-size: 22px;
}

@keyframes shake {
  0%,
  100% {
    transform: rotateY(180deg) translateX(0);
  }
  25% {
    transform: rotateY(180deg) translateX(-3px);
  }
  50% {
    transform: rotateY(180deg) translateX(3px);
  }
  75% {
    transform: rotateY(180deg) translateX(-2px);
  }
}

/* 小さい画面向け微調整 */
@media (max-width: 360px) {
  :root {
    --gap: 6px;
  }
  .hud-item {
    padding: 4px 6px;
  }
  .btn {
    padding: 5px 8px;
    font-size: 13px;
  }
  .board {
    --boardSize: min(100vw - 16px, 100vh - 210px);
  }
}
</style>
