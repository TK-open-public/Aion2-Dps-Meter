package com.tbread.upload

import com.tbread.entity.DpsLog

object UploadManager {
    private val uploader: BattleLogUploader? by lazy { tryLoad() }

    private fun tryLoad(): BattleLogUploader? = try {
        @Suppress("UNCHECKED_CAST")
        val cls = Class.forName("com.tbread.upload.SecretUploader")
        cls.getDeclaredConstructor().newInstance() as BattleLogUploader
    } catch (_: ClassNotFoundException) {
        null
    } catch (e: Exception) {
        println("[UploadManager] uploader load failed: ${e.message}")
        null
    }

    fun isAvailable(): Boolean = uploader != null

    fun upload(log: DpsLog): Boolean {
        val u = uploader ?: return false
        return u.upload(log)
    }
}
