<template>
  <section class="home">
    <header class="hero">
      <h2>Mini Games Collection</h2>
      <p>
        Vue の <code>&lt;transition&gt;</code> /
        <code>&lt;transition-group&gt;</code> を活かした学習用ゲーム集
      </p>
    </header>

    <TransitionGroup name="cards" tag="ul" class="card-grid">
      <li
        v-for="g in games"
        :key="g.path"
        class="card"
        @click="go(g.path)"
        tabindex="0"
        @keyup.enter="go(g.path)"
      >
        <div class="emoji" aria-hidden="true">{{ g.emoji }}</div>
        <h3>{{ g.title }}</h3>
        <p class="desc">{{ g.desc }}</p>
        <div class="badges">
          <span v-for="b in g.badges" :key="b" class="badge">{{ b }}</span>
        </div>
      </li>
    </TransitionGroup>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

type GameSummary = {
  title: string
  desc: string
  path: string
  emoji: string
  badges: string[]
}

const router = useRouter()

const games: GameSummary[] = [
  {
    title: 'Memory Cards（神経衰弱）',
    desc: 'カードのフリップ演出（rotateY）と状態遷移の基礎',
    path: '/memory',
    emoji: '🃏',
    badges: ['3D flip', 'state'],
  },
  {
    title: 'Whac-a-Mole（モグラ叩き）',
    desc: '出現/退場をバウンスさせるアニメーションとスコア管理を練習',
    path: '/whac-a-mole',
    emoji: '🛠️',
    badges: ['transition', 'Pinia'],
  },
  {
    title: 'Reflex Test（反射神経）',
    desc: 'フェード/スケールで「Ready→Go!」を演出し、反応速度を計測',
    path: '/reflex',
    emoji: '⚡',
    badges: ['timing', 'animation'],
  },
  {
    title: 'Falling Catch（落ち物キャッチ）',
    desc: 'requestAnimationFrame で落下を制御、当たり判定に挑戦',
    path: '/catch',
    emoji: '🍎',
    badges: ['rAF', 'collision'],
  },
]

function go(path: string) {
  // まだ実装していないページはアラート（のちに削除）
  // 実装済みなら router.push(path)
  router.push(path).catch(() => {
    alert('このゲームはまだ準備中です！まずは /whac-a-mole から実装していきましょう。')
  })
}
</script>

<style scoped>
.home {
  max-width: 1100px;
  margin: 0 auto;
}
.hero {
  margin-bottom: 18px;
}
.hero h2 {
  margin: 0 0 4px;
  font-size: 1.6rem;
}
.hero p {
  margin: 0;
  opacity: 0.8;
}

.card-grid {
  list-style: none;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  padding: 0;
  margin: 0;
}
.card {
  background: #171b31;
  border: 1px solid #2a3555;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  outline: none;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  transform: translateY(0) scale(1);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}
.card:hover,
.card:focus {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  border-color: #3e55a8;
}
.emoji {
  font-size: 2rem;
  margin-bottom: 8px;
}
.desc {
  opacity: 0.85;
  min-height: 40px;
}
.badges {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 999px;
  background: #24305c;
  border: 1px solid #3b4c93;
  opacity: 0.95;
}

/* TransitionGroup animations */
.cards-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}
.cards-enter-active {
  transition: all 0.28s ease;
}
.cards-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
.cards-leave-active {
  transition: all 0.2s ease;
  position: relative;
  z-index: 0;
}
.cards-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
