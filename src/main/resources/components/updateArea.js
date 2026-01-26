window.UpdateArea = {
  setup() {
    const {computed} = Vue;
    const currentVersion = ref("");
    const LatestVersion = ref("");

    const updateExists = computed(() => {
      const curParts = currentVersion.value.split('.').map(n => parseInt(n) || 0);
      const newParts = LatestVersion.value.split('.').map(n => parseInt(n) || 0);

      const maxLength = Math.max(curParts.length, newParts.length);

      for (let i = 0; i < maxLength; i++) {
        const cur = curParts[i] || 0;
        const newVer = newParts[i] || 0;

        if (newVer > cur) return true;
        if (newVer < cur) return false;
      }

      return false;
    });

    const updateBtnClick = () => {
      window.open('https://github.com/TK-open-public/Aion2-Dps-Meter/releases', '_blank');
    };

    window.addEventListener('javaReady', () => {
      currentVersion.value = window.javaBridge?.getCurrentVersion()
      LatestVersion.value = window.javaBridge?.getLatestVersion()
    }, {once: true});

    return {
      currentVersion,
      LatestVersion,
      updateExists,
      updateBtnClick
    };
  },
  template: `
        <div
          class="updateModal"
          id="updateModal"
          v-if="updateExists"
          >
          <div class="updateModalCard">
            <div class="updateModalTitle">신규 업데이트</div>
            <div
              class="updateModalText"
              id="updateModalText">
              <div>
                <p>신규 업데이트가 있습니다!</p>
                <p>현재버전 : {{ currentVersion }}</p>
                <p>최신버전 : {{ LatestVersion }}</p>
                <p>업데이트를 먼저 진행해주세요.</p>
              </div>
            </div>
            <div class="updateModalActions">
              <button class="updateModalBtn primary" @click="updateBtnClick">다운로드</button>
            </div>
          </div>
        </div>
    `
};