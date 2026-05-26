const STORAGE_KEY = 'fitplan_mvp_v1';
const state = loadState();

const templates = {
  push: {
    title: 'Грудь + плечи + трицепс',
    focus: 'Сила верха',
    exercises: [
      ['Жим лёжа', 'bench', 4, '6–10'],
      ['Жим гантелей на скамье', 'dumbbell', 3, '8–12'],
      ['Жим стоя / сидя', 'bar', 3, '6–10'],
      ['Разведение гантелей в стороны', 'dumbbell', 3, '12–15'],
      ['Французский жим', 'bar', 3, '10–12']
    ]
  },
  pull: {
    title: 'Спина + бицепс',
    focus: 'Тяга и осанка',
    exercises: [
      ['Подтягивания', 'body', 4, 'макс − 1'],
      ['Тяга штанги к поясу', 'bar', 4, '8–10'],
      ['Тяга гантели одной рукой', 'dumbbell', 3, '10–12'],
      ['Шраги с гантелями/штангой', 'bar', 3, '12–15'],
      ['Подъем штанги на бицепс', 'bar', 3, '8–12']
    ]
  },
  legs: {
    title: 'Ноги + кор',
    focus: 'Ноги и корпус',
    exercises: [
      ['Присед со штангой', 'squat', 4, '6–10'],
      ['Румынская тяга', 'bar', 4, '8–10'],
      ['Выпады с гантелями', 'dumbbell', 3, '10 на ногу'],
      ['Болгарские приседы', 'dumbbell', 3, '8–10 на ногу'],
      ['Планка', 'core', 3, '30–60 сек']
    ]
  },
  conditioning: {
    title: 'Функционал + груша',
    focus: 'Выносливость',
    exercises: [
      ['Круг: отжимания + тяга резинки + присед', 'body', 4, '30 сек работа'],
      ['Удары по груше', 'bag', 6, '2 мин'],
      ['Дорожка интервалы', 'treadmill', 1, '15–22 мин'],
      ['Подтягивания легкие', 'body', 3, '50% от максимума'],
      ['Растяжка плеч/бедер', 'mobility', 1, '10 мин']
    ]
  },
  recovery: {
    title: 'Кардио + мобилити',
    focus: 'Восстановление',
    exercises: [
      ['Дорожка спокойная', 'treadmill', 1, '25–45 мин'],
      ['Резинка: плечи и спина', 'band', 3, '15–20'],
      ['Растяжка задней поверхности бедра', 'mobility', 2, '60 сек'],
      ['Растяжка грудных и широчайших', 'mobility', 2, '60 сек'],
      ['Дыхание / легкая прогулка', 'recovery', 1, '5–10 мин']
    ]
  }
};

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { profile: null, plan: [], completed: {}, measurements: {} }; }
  catch { return { profile: null, plan: [], completed: {}, measurements: {} }; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function kg(value) { return Math.max(0, Math.min(80, Math.round(value / 2.5) * 2.5)); }
function getBaseWeight(profile, type, week) {
  const exp = profile.experience;
  const energy = profile.energy;
  const weight = Number(profile.weight || 75);
  let multiplier = exp === 'advanced' ? .72 : exp === 'middle' ? .58 : .42;
  if (energy === 'low') multiplier -= .08;
  if (energy === 'high') multiplier += .05;
  const progression = 1 + (week - 1) * .035;
  if (type === 'bench') return kg((Number(profile.bench) || weight * multiplier) * progression);
  if (type === 'squat') return kg((Number(profile.squat) || weight * (multiplier + .1)) * progression);
  if (type === 'bar') return kg(weight * (multiplier - .08) * progression);
  if (type === 'dumbbell') return `${kg(weight * .12 * progression)}–${kg(weight * .18 * progression)} кг`;
  if (type === 'body') return 'свой вес';
  if (type === 'bag') return '—';
  if (type === 'treadmill') return profile.goal === 'fatloss' ? 'пульс 120–150' : 'легко/средне';
  return '—';
}
function warmup(profile) {
  return [
    'Дорожка 6–8 минут в лёгком темпе',
    'Суставная разминка: шея, плечи, локти, таз, колени, голеностоп',
    'Резинка: 2×15 тяга к лицу + внешняя ротация плеча',
    'Перед первым базовым упражнением: 2 разминочных подхода с лёгким весом'
  ];
}
function stretch() {
  return [
    'Растяжка груди у стены — 60 сек',
    'Задняя поверхность бедра — 60 сек на сторону',
    'Сгибатели бедра — 60 сек на сторону',
    'Широчайшие / плечи — 60 сек',
    'Спокойное дыхание 2 минуты'
  ];
}
function dayScheme(days) {
  if (Number(days) === 3) return ['push', 'pull', 'legs'];
  if (Number(days) === 5) return ['push', 'pull', 'recovery', 'legs', 'conditioning'];
  return ['push', 'pull', 'legs', 'conditioning'];
}
function generatePlan(profile) {
  const scheme = dayScheme(profile.days);
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
  const plan = [];
  for (let week = 1; week <= 4; week++) {
    const weekWorkouts = scheme.map((key, index) => {
      const tpl = templates[key];
      return {
        id: `w${week}d${index + 1}`,
        week,
        day: dayNames[index],
        title: tpl.title,
        focus: tpl.focus,
        warmup: warmup(profile),
        exercises: tpl.exercises.map(ex => ({
          name: ex[0],
          weight: getBaseWeight(profile, ex[1], week),
          sets: ex[2],
          reps: ex[3]
        })),
        stretch: stretch(),
        note: week === 4 ? 'Контрольная неделя: техника важнее эго. Не гонись за максимумом.' : 'Если все подходы дались легко — добавь 1–2 повтора или +2.5 кг в следующий раз.'
      };
    });
    plan.push({ week, workouts: weekWorkouts });
  }
  return plan;
}

function renderPlan() {
  const box = document.getElementById('planContainer');
  if (!state.plan.length) { box.className = 'plan-container empty-state'; box.textContent = 'План пока не создан.'; return; }
  box.className = 'plan-container';
  box.innerHTML = state.plan.map(week => `
    <article class="week-card">
      <h3>Неделя ${week.week}</h3>
      <div class="workouts-grid">
        ${week.workouts.map(w => workoutHtml(w)).join('')}
      </div>
    </article>
  `).join('');
  document.querySelectorAll('[data-complete]').forEach(cb => cb.addEventListener('change', e => {
    state.completed[e.target.dataset.complete] = e.target.checked;
    saveState(); renderAll();
  }));
}
function workoutHtml(w) {
  const done = !!state.completed[w.id];
  return `
    <div class="workout ${done ? 'done' : ''}">
      <div class="workout-head">
        <div><h4>${w.day}: ${w.title}</h4><span class="tag">${w.focus}</span></div>
        <label><input type="checkbox" data-complete="${w.id}" ${done ? 'checked' : ''}> Готово</label>
      </div>
      <div class="block-title">Разминка</div>
      <ol class="exercise-list">${w.warmup.map(x => `<li>${x}</li>`).join('')}</ol>
      <div class="block-title">Основная часть</div>
      <ol class="exercise-list">${w.exercises.map(x => `<li><b>${x.name}</b>: ${x.sets}×${x.reps}, вес: <b>${x.weight}</b></li>`).join('')}</ol>
      <div class="block-title">Растяжка</div>
      <ol class="exercise-list">${w.stretch.map(x => `<li>${x}</li>`).join('')}</ol>
      <p><b>Правило:</b> ${w.note}</p>
    </div>`;
}
function renderMeasurements() {
  const points = ['Старт', 'Неделя 1', 'Неделя 2', 'Неделя 3', 'Финиш месяца'];
  const rows = ['Вес', 'Талия', 'Грудь', 'Бицепс', 'Бедро', 'Самочувствие', 'Фото/заметка'];
  document.getElementById('measurementsContainer').innerHTML = `
    <table class="measure-table">
      <thead><tr><th>Параметр</th>${points.map(p => `<th>${p}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr><td><b>${row}</b></td>${points.map(p => {
        const key = `${row}_${p}`;
        return `<td><input data-measure="${key}" value="${state.measurements[key] || ''}" /></td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table>`;
  document.querySelectorAll('[data-measure]').forEach(input => input.addEventListener('input', e => {
    state.measurements[e.target.dataset.measure] = e.target.value;
    saveState(); updateProgress();
  }));
}
function updateProgress() {
  const total = state.plan.reduce((sum, w) => sum + w.workouts.length, 0);
  const done = Object.values(state.completed).filter(Boolean).length;
  const filledMeasures = Object.values(state.measurements).filter(v => String(v).trim()).length;
  const points = done * 25 + filledMeasures * 3;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const level = points >= 420 ? 'Машина' : points >= 260 ? 'Атлет' : points >= 120 ? 'Воин' : 'Новичок';
  document.getElementById('pointsValue').textContent = points;
  document.getElementById('levelBadge').textContent = level;
  document.getElementById('doneCount').textContent = done;
  document.getElementById('streakCount').textContent = Math.min(done, 7);
  document.getElementById('monthPercent').textContent = `${percent}%`;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('motivationBox').textContent = motivationText(percent, done, level);
}
function motivationText(percent, done, level) {
  if (!state.profile) return 'Заполни анкету и начни первый месяц.';
  if (percent === 0) return 'Первый шаг самый тяжелый. Сегодня твоя задача — просто начать.';
  if (percent < 30) return `Уровень ${level}. Не геройствуй, закрепи привычку и не пропускай разминку.`;
  if (percent < 70) return `Ты уже в процессе. Выполнено ${done} тренировок — продолжай без рывков и травм.`;
  if (percent < 100) return 'Финиш рядом. Последняя часть месяца решает, будет ли это привычкой.';
  return 'Месяц закрыт. Сделай замеры, сравни результат и запускай следующий цикл.';
}
function renderIntro() {
  const intro = document.getElementById('planIntro');
  if (!state.profile) { intro.textContent = 'Сначала заполни анкету и сгенерируй план.'; return; }
  intro.textContent = `${state.profile.name || 'Твой'} план: цель — ${goalName(state.profile.goal)}, ${state.profile.days} тренировочных дня в неделю.`;
}
function goalName(goal) {
  return { fatloss: 'сжечь жир / подтянуть форму', muscle: 'набрать мышцы', strength: 'стать сильнее', general: 'общая форма' }[goal] || 'общая форма';
}
function renderAll() { renderIntro(); renderPlan(); renderMeasurements(); updateProgress(); }

// UI
document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active-panel'));
  btn.classList.add('active');
  document.getElementById(btn.dataset.tab).classList.add('active-panel');
}));
document.getElementById('profileForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  state.profile = data;
  state.plan = generatePlan(data);
  state.completed = {};
  saveState();
  renderAll();
  document.querySelector('[data-tab="plan"]').click();
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Сбросить анкету, план и прогресс?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});
document.getElementById('printBtn').addEventListener('click', () => window.print());

if (state.profile) {
  Object.entries(state.profile).forEach(([k, v]) => {
    const field = document.querySelector(`[name="${k}"]`);
    if (field) field.value = v;
  });
}
renderAll();
