package com.tbread.webview

import com.tbread.DpsCalculator
import io.github.oshai.kotlinlogging.KotlinLogging
import javafx.application.HostServices
import javafx.application.Platform
import javafx.stage.Stage
import kotlin.system.exitProcess

class JSBridge(
    private val stage: Stage,
    private val dpsCalculator: DpsCalculator,
    private val hostServices: HostServices
) {
    private val logger = KotlinLogging.logger {}
    private val version = "0.2.4"

    fun moveWindow(x: Double, y: Double) {
        stage.x = x
        stage.y = y
    }

    fun openBrowser(url: String) {
        try {
            hostServices.showDocument(url)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun exitApp() {
        Platform.exit()
        exitProcess(0)
    }

    fun resetDps() {
        dpsCalculator.resetDataStorage()
    }

    fun printLog(message: String) {
        logger.debug { "[JS LOG] $message" }
    }

    fun getCurrentVersion(): String {
        return version
    }

    fun getLatestVersion(): String {
        return GitReleaseParser.currentVersion.ifEmpty { version }
    }
}