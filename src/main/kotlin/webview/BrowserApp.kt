package com.tbread.webview

import com.sun.javafx.webkit.WebConsoleListener
import com.tbread.DpsCalculator
import com.tbread.entity.DpsData
import io.github.oshai.kotlinlogging.KotlinLogging
import javafx.animation.KeyFrame
import javafx.animation.Timeline
import javafx.application.Application
import javafx.concurrent.Worker
import javafx.scene.Scene
import javafx.scene.paint.Color
import javafx.scene.web.WebErrorEvent
import javafx.scene.web.WebView
import javafx.stage.Screen
import javafx.stage.Stage
import javafx.stage.StageStyle
import javafx.util.Duration
import kotlinx.serialization.json.Json
import netscape.javascript.JSObject
import kotlin.system.exitProcess

class JSBridge(private val stage: Stage, private val dpsCalculator: DpsCalculator) {
    private val logger = KotlinLogging.logger {}

    fun moveWindow(x: Double, y: Double) {
        stage.x = x
        stage.y = y
    }

    fun resetDps() {
        dpsCalculator.resetDataStorage()
    }

    fun log(level: String, message: String) {
        when (level) {
            "LOG" -> logger.info { message }
            "ERROR" -> logger.error { message }
            "WARN" -> logger.warn { message }
        }
    }
}

class BrowserApp(private val dpsCalculator: DpsCalculator) : Application() {
    private val logger = KotlinLogging.logger {}

    @Volatile
    private var dpsData: DpsData = dpsCalculator.getDps()

    private val debugMode = false

    override fun start(stage: Stage) {
        stage.setOnCloseRequest {
            exitProcess(0)
        }

        val webView = WebView()
        val engine = webView.engine
        val bridge = JSBridge(stage, dpsCalculator)

        engine.loadWorker.stateProperty().addListener { _, _, newState ->
            if (newState == Worker.State.SUCCEEDED) {
                val window = engine.executeScript("window") as JSObject
                window.setMember("javaBridge", bridge)
                window.setMember("dpsData", this)

                // JS에서 console.log를 가로채도록 설정
                engine.executeScript(
                    """
                      (function() {
                          window.dispatchEvent(new CustomEvent('javaReady'));
                      })();
                    """.trimIndent()
                )

                WebConsoleListener.setDefaultListener { _, message, _, _ ->
                    val logMsg = "JS Console : $message"
                    logger.info { logMsg }
                    println(logMsg)
                }

                // 2. WebEngine 에러 이벤트 핸들러
                engine.setOnError { event: WebErrorEvent ->
                    logger.error { "WebEngine Error: ${event.message}" }
                    System.err.println("❌ WebEngine Error: ${event.message}")
                }
            } else if (newState == Worker.State.FAILED) {
                logger.error { "Failed to load web page: ${engine.loadWorker.exception}" }
            }
        }

        engine.load(javaClass.getResource("/index.html")?.toExternalForm())

        val scene = Scene(webView, 1000.0, 1000.0)
        scene.fill = Color.TRANSPARENT

        try {
            val pageField = engine.javaClass.getDeclaredField("page")
            pageField.isAccessible = true
            val page = pageField.get(engine)

            val setBgMethod = page.javaClass.getMethod("setBackgroundColor", Int::class.javaPrimitiveType)
            setBgMethod.isAccessible = true
            setBgMethod.invoke(page, 0)
        } catch (e: Exception) {
            logger.error(e) { "리플렉션 실패" }
        }

        stage.initStyle(StageStyle.TRANSPARENT)
        stage.scene = scene
        stage.isAlwaysOnTop = true
        stage.title = "Aion2 Dps Overlay"

        val primaryScreen = Screen.getPrimary()
        val bounds = primaryScreen.visualBounds

        stage.x = bounds.minX + bounds.width * 0.7
        stage.y = bounds.minY + bounds.height * 0.05

        logger.info { "Screen resolution: ${bounds.width}x${bounds.height}" }

        stage.show()
        Timeline(KeyFrame(Duration.millis(500.0), {
            dpsData = dpsCalculator.getDps()
        })).apply {
            cycleCount = Timeline.INDEFINITE
            play()
        }
    }

    fun getDpsData(): String {
        return Json.encodeToString(dpsData)
    }

    fun isDebuggingMode(): Boolean {
        return debugMode
    }

    fun getBattleDetail(uid: Int): String {
        return Json.encodeToString(dpsData.map[uid]?.analyzedData)
    }
}
