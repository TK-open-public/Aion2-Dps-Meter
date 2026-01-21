window.MeterArea = {
  props: {
    rows: {
      type: Array,
      required: true
    }
  },
  emits: ['onClickUserRow'],
  setup(props, {emit}) {
    const {computed} = Vue;
    const dpsFormatter = new Intl.NumberFormat("ko-KR");
    const topDps = computed(() => {
      return props.rows.reduce((max, row) => {
        return Math.max(max, Number(row?.dps) || 0);
      }, 1);
    });

    const onClickUserRow = (row) => {
      emit('onClickUserRow', row);
    }

    const getJobIcon = (job) => {
      return job ? `./assets/${job}.png` : '';
    };

    const contributionClass = (contribution) => {
      const value = Number(contribution) || 0;

      if(value < 3) {
        return "error";
      } else if (value < 5) {
        return "warning";
      } else {
        return "";
      }
    }

    const sliceRows = computed(() => {
      return props.rows.slice(0, 15);
    });

    return {
      dpsFormatter,
      topDps,
      onClickUserRow,
      getJobIcon,
      contributionClass,
      sliceRows
    };
  },
  template: `
      <div class="list" :class="{ hasRows: rows.length > 0 }">
        <div v-for="row in sliceRows" class="item" :class="[{ isUser: !!row.isUser}, contributionClass(row.damageContribution)]"
            :key="row.id || row.name" :data-row-id="row.id || row.name" @click="onClickUserRow(row)">
          <div class="fill" :style="{ transform: 'scaleX(' + Math.max(0, Math.min(1, row.dps / topDps)) + ')' }"></div>
          <div class="content">
            <div class="classIcon">
              <img 
                class="classIconImg" 
                :src="getJobIcon(row.job)"
                :style="{ visibility: row.job ? 'visible' : 'hidden' }"
                draggable="false"
                alt="" />
            </div>
            <div class="name">{{ row.name }}</div>
            <div class="dps">
              <p>{{ dpsFormatter.format(row.dps || 0) }}/초</p>
              <p class="dpsContribution">{{ row.damageContribution || 0 }}%</p>
            </div>
          </div>
        </div>
      </div>
    `
}