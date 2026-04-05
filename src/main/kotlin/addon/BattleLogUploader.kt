package com.tbread.addon

import com.tbread.entity.DpsLog

interface BattleLogUploader {
    fun upload(log: DpsLog): Boolean
}
