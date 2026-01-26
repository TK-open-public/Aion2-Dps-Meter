package com.tbread.webview

import com.tbread.DpsCalculator
import com.tbread.entity.DpsData
import io.github.oshai.kotlinlogging.KotlinLogging
import javafx.animation.KeyFrame
import javafx.animation.Timeline
import javafx.application.Application
import javafx.concurrent.Worker
import javafx.scene.Scene
import javafx.scene.image.Image
import javafx.scene.paint.Color
import javafx.scene.web.WebView
import javafx.stage.Screen
import javafx.stage.Stage
import javafx.stage.StageStyle
import javafx.util.Duration
import kotlinx.serialization.json.Json
import netscape.javascript.JSObject
import kotlin.system.exitProcess

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
        engine.load(javaClass.getResource("/index.html")?.toExternalForm())

        val bridge = JSBridge(stage, dpsCalculator, hostServices)
        engine.loadWorker.stateProperty().addListener { _, _, newState ->
            if (newState == Worker.State.SUCCEEDED) {
                val window = engine.executeScript("window") as JSObject
                window.setMember("javaBridge", bridge)
                window.setMember("dpsData", this)

                // vue에게 자바준비 이벤트를 발생시킴
                engine.executeScript(
                    """
                      (function() {
                        console.log = function() {
                            var message = Array.prototype.slice.call(arguments).map(function(arg) {
                                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                            }).join(' ');

                            if (window.javaBridge) {
                                window.javaBridge.printLog('[LOG] ' + message);
                            }
                        };
                        
                        console.warn = function() {
                            var message = Array.prototype.slice.call(arguments).map(function(arg) {
                                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                            }).join(' ');

                            if (window.javaBridge) {
                                window.javaBridge.printLog('[LOG] ' + message);
                            }
                        };
                        
                        console.error = function() {
                            var message = Array.prototype.slice.call(arguments).map(function(arg) {
                                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                            }).join(' ');

                            if (window.javaBridge) {
                                window.javaBridge.printLog('[LOG] ' + message);
                            }
                        };

                        window.onerror = function(msg, url, line, col, error) {
                            var errorMessage = 'ERROR: ' + msg + ' at ' + url + ':' + line + ':' + col;
                            if (error && error.stack) {
                                errorMessage += '\nStack: ' + error.stack;
                            }
                            if (window.javaBridge) {
                                window.javaBridge.printLog(errorMessage);
                            }
                            return false;
                        };
                      
                        window.dispatchEvent(new CustomEvent('javaReady'));
                      })();
                    """.trimIndent()
                )
            } else if (newState == Worker.State.FAILED) {
                logger.error { "Failed to load web page: ${engine.loadWorker.exception}" }
            }
        }

        engine.load(javaClass.getResource("/index.html")?.toExternalForm())

        val scene = Scene(webView, 1200.0, 1000.0)
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

        val iconStream = javaClass.getResourceAsStream("/assets/icon.png")
        if (iconStream != null) {
            stage.icons.add(Image(iconStream))
        }

        val primaryScreen = Screen.getPrimary()
        val bounds = primaryScreen.visualBounds

        stage.x = bounds.minX + bounds.width * 0.7
        stage.y = bounds.minY + bounds.height * 0.05


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
