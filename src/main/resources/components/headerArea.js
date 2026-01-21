window.HeaderArea = {
  props: {
    targetName: {
      type: String,
    },
    isCollapse: {
      type: Boolean,
      required: true
    }
  },
  emits: ['resetClick', 'collapseClick'],
  setup(props, {emit}) {
    const {watch, onMounted, nextTick} = Vue;

    const resetClick = () => {
      emit('resetClick');
    };

    const collapseClick = () => {
      emit('collapseClick');
    }

    onMounted(() => {
      lucide.createIcons();
    });

    watch(() => props.isCollapse, () => {
      nextTick(() => {
        lucide.createIcons();
      });
    });

    return {
      resetClick,
      collapseClick,
    };
  },
  template: `
        <div class="header">
          <div class="bossIcon">
            <img src="./assets/logo.png"  alt=""/>
          </div>
          <div class="bossNames">
            <span class="bossName">{{ targetName || "DPS METER" }}</span>
          </div>
          <div class="headerBtns">
            <div class="headerBtn resetBtn" @click="resetClick"><i data-lucide="rotate-ccw"></i></div>
            <div class="headerBtn collapseBtn" v-if="!isCollapse" @click="collapseClick">
              <i class="collapseIcon" 
                data-lucide="arrow-up-wide-narrow"></i>
            </div>
            <div class="headerBtn collapseBtn" v-else @click="collapseClick">
                <i class="collapseIcon" 
                data-lucide="arrow-down-wide-narrow"></i>
            </div>
          </div>
        </div>
    `
};