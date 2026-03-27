package com.tbread.upload

interface BattleLogUploader {
    fun upload(reportJson: String): Boolean
}