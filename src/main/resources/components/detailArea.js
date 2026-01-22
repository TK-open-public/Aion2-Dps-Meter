const safeParseJSON = (raw) => {
  if (typeof raw !== "string") {
    return "";
  }
  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object" ? value : "";
  } catch {
    return "";
  }
}

window.DetailArea = {
  props: {
    isDetailOpen: {
      type: Boolean,
      required: true
    },
    id: {
      type: String,
      required: true
    },
    combatTime: {
      type: String,
      required: true
    }
  },
  emits: ['closeClick',],
  setup(props, {emit}) {
    const {computed} = Vue;
    const numberFormatter = new Intl.NumberFormat('ko-KR');

    const battleDetail = computed(() => {
      if (!props.id || !window.dpsData?.getBattleDetail) {
        return {};
      }

      const raw = window.dpsData.getBattleDetail(props.id);
      return safeParseJSON(raw);
    });

    const skillList = computed(() => {
      const detailObj = battleDetail.value;
      const skills = [];

      if(detailObj) {
        for (const [code, value] of Object.entries(detailObj)) {
          const dmg = Math.trunc(Number(value.damageAmount)) || 0;
          if (dmg <= 0) {
            continue;
          }

          const nameRaw = typeof value.skillName === "string" ? value.skillName.trim() : "";

          skills.push({
            code,
            name: nameRaw ? nameRaw : `스킬 ${code}`,
            time: Math.trunc(Number(value.times)) || 0,
            crit: Math.trunc(Number(value.critTimes)) || 0,
            parry : Number(value.parryTimes) || 0,
            backTime : Number(value.backTimes) || 0,
            perfect : Number(value.perfectTimes) || 0,
            double : Number(value.doubleTimes) || 0,
            dmg,
          });
        }
      }

      return skills.sort((a, b) => b.dmg - a.dmg);
    });

    const stats = computed(() => {
      return skillList.value.reduce((acc, skill) => {
        acc.totalDmg += skill.dmg || 0;
        acc.totalCrit += skill.crit || 0;
        acc.totalTimes += skill.time || 0;
        acc.totalParry += skill.parry || 0;
        acc.totalBack += skill.backTime || 0;
        acc.totalPerfect += skill.perfect || 0;
        acc.totalDouble += skill.double || 0;

        return acc;
      }, {
        totalDmg: 0,
        totalCrit: 0,
        totalTimes: 0,
        totalParry: 0,
        totalBack: 0,
        totalPerfect: 0,
        totalDouble: 0
      });
    });

    const percent = computed(() => {
      const detailObj = battleDetail.value;
      if (!detailObj) return "-";

      const contrib = Number(detailObj.damageContribution);
      return Number.isFinite(contrib) ? `${contrib.toFixed(1)}%` : "-";
    });

    const getSkillWidth = computed(() => {
      if (!stats.value.totalDmg || stats.value.totalDmg === 0) {
        return 'scaleX(0)';
      }

      return (dmg) => {
        const ratio = Math.max(0, Math.min(1, (Number(dmg) || 0) / stats.value.totalDmg));
        return `scaleX(${ratio})`;
      };
    });

    const closeClick = () => {
      emit('closeClick');
    }

    const getCritRate = (skill) => {
      const time = Number(skill.time);
      const crit = Number(skill.crit) || 0;
      return time > 0 ? Math.floor((crit / time) * 100) : 0;
    };

    const getDmgPercent = computed(() => {
      return (dmg) => {
        if (!stats.value.totalDmg || stats.value.totalDmg === 0) return 0;
        return Math.round(((Number(dmg) || 0) / stats.value.totalDmg) * 100);
      };
    });

    const pct = (num) => {
      if (stats.value.totalTimes <= 0) return 0;
      return Math.round((num / stats.value.totalTimes) * 1000) / 10;
    };

    return {
      skillList,
      percent,
      getSkillWidth,
      closeClick,
      getCritRate,
      getDmgPercent,
      numberFormatter,
      totalDmg: computed(() => stats.value.totalDmg),
      totalCrit: computed(() => pct(stats.value.totalCrit)),
      totalTimes: computed(() => stats.value.totalTimes),
      totalParry: computed(() => pct(stats.value.totalParry)),
      totalBack: computed(() => pct(stats.value.totalBack)),
      totalPerfect: computed(() => pct(stats.value.totalPerfect)),
      totalDouble: computed(() => pct(stats.value.totalDouble)),
    };
  },
  template: `
      <div
        :class="{ open: isDetailOpen }"
        class="detailsPanel"
        role="dialog"
        aria-modal="true">
        <div class="detailsHeader">
          <div class="detailsTitle">상세</div>
          <div class="tooltip"></div>
          <div class="closeX detailsClose" @click="closeClick">×</div>
        </div>

        <div class="detailsBody">
          <div class="detailsStats">
            <div class="stat">
              <p class="label">누적 피해량</p>
              <p class="value">{{ numberFormatter.format(totalDmg) }}</p>
            </div>
            <div class="stat">
              <p class="label">피해량 기여도</p>
              <p class="value">{{ percent }}</p>
            </div>
            <div class="stat">
              <p class="label">치명타 비율</p>
              <p class="value">{{ totalCrit }}</p>
            </div>
            <div class="stat">
              <p class="label">완벽 비율</p>
              <p class="value">{{ totalPerfect }}</p>
            </div>
            <div class="stat">
              <p class="label">강타 비율</p>
              <p class="value">{{ totalDouble }}</p>
            </div>
            <div class="stat">
              <p class="label">백어택 비율</p>
              <p class="value">{{ totalBack }}</p>
            </div>
            <div class="stat">
              <p class="label">보스 막기비율</p>
              <p class="value">{{ totalParry }}</p>
            </div>
            <div class="stat">
              <p class="label">전투시간</p>
              <p class="value">{{ combatTime || "00:00"}}</p>
            </div>
          </div>

          <div class="detailsSkills">
            <div class="skillHeader">
              <div class="cell name center">스킬명</div>
              <div class="cell center hit">타격횟수</div>
              <div class="cell center crit">치명타</div>
              <div class="cell center parry">패리</div>
              <div class="cell center perfect">완벽</div>
              <div class="cell center double">강타</div>
              <div class="cell center back">백어택</div>
              <div class="cell dmg">누적 피해량</div>
            </div>

            <div class="skills">
              <div 
                v-for="skill in skillList" 
                :key="skill.code"
                class="skillRow">
                
                <div class="cell name">{{ skill.name }}</div>
                <div class="cell center hit">{{ skill.time }}</div>
                <div class="cell center crit">{{ skill.crit }}</div>
                <div class="cell center parry">{{ skill.parry }}</div>
                <div class="cell center perfect">{{ skill.perfect }}</div>
                <div class="cell center double">{{ skill.double }}</div>
                <div class="cell center back">{{ skill.backTime }}</div>
                <div class="cell dmg right">
                  <div class="dmgFill" :style="{ transform: getSkillWidth(skill.dmg) }"></div>
                  <div class="dmgText">{{ numberFormatter.format(Number(skill.dmg) || 0) }} ({{ getDmgPercent(skill.dmg) }}%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
}