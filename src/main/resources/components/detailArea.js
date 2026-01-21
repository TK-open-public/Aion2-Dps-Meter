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
            dmg,
          });
        }
      }

      return skills.sort((a, b) => b.dmg - a.dmg).slice(0, 15);
    });

    const totalDmg = computed(() => {
      return skillList.value.reduce((sum, skill) => sum + skill.dmg, 0);
    });

    const percent = computed(() => {
      const detailObj = battleDetail.value;
      if (!detailObj) return "-";

      const contrib = Number(detailObj.damageContribution);
      return Number.isFinite(contrib) ? `${contrib.toFixed(1)}%` : "-";
    });

    const getSkillWidth = (dmg) => {
      const ratio = Math.max(0, Math.min(1, (Number(dmg) || 0) / totalDmg.value));
      return `scaleX(${ratio})`;
    };

    const closeClick = () => {
      emit('closeClick');
    }

    const getCritRate = (skill) => {
      const time = Number(skill.time);
      const crit = Number(skill.crit) || 0;
      return time > 0 ? Math.floor((crit / time) * 100) : 0;
    };

    const getDmgPercent = (dmg) => {
      if (!totalDmg.value || totalDmg.value === 0) return 0;
      return Math.round(((Number(dmg) || 0) / totalDmg.value) * 100);
    };

    return {
      skillList,
      totalDmg,
      percent,
      getSkillWidth,
      closeClick,
      getCritRate,
      getDmgPercent,
      numberFormatter,
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
              <p class="label">전투시간</p>
              <p class="value">{{ combatTime || "00:00"}}</p>
            </div>
          </div>

          <div class="detailsSkills">
            <div class="skillHeader">
              <div class="cell name center">스킬명</div>
              <div class="cell cast">
                <span class="castHit">명중횟수</span>
                <span class="castCrit">(치명)</span>
              </div>
              <div class="cell dmg">누적 피해량</div>
            </div>

            <div class="skills">
              <div 
                v-for="skill in skillList" 
                :key="skill.code"
                class="skillRow">
                <div class="cell name">{{ skill.name }}</div>
                
                <div class="cell cast">
                  <span class="castHit">{{ skill.time }}회</span>
                  <span class="castCrit">({{ getCritRate(skill) }}%)</span>
                </div>
                
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