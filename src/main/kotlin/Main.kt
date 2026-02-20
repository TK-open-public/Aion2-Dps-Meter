package com.tbread

import com.tbread.config.PcapCapturerConfig
import com.tbread.packet.PcapCapturer
import com.tbread.packet.StreamAssembler
import com.tbread.packet.StreamProcessor
import com.tbread.webview.BrowserApp
import javafx.application.Platform
import javafx.stage.Stage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.slf4j.LoggerFactory

fun main(args: Array<String>) {
    WindowsElevation.ensureRunAsAdminOrRelaunch(args)

    runBlocking {
        val logger = LoggerFactory.getLogger("Main")
        Thread.setDefaultUncaughtExceptionHandler { t, e ->
            logger.error("thread dead {}", t.name, e)
        }
        val channel = Channel<ByteArray>(capacity = 4096)
        val config = PcapCapturerConfig.loadFromProperties()

        val dataStorage = DataStorage()
        val processor = StreamProcessor(dataStorage)
        val assembler = StreamAssembler(processor)
        val capturer = PcapCapturer(config, channel)
        val calculator = DpsCalculator(dataStorage)

        launch(Dispatchers.Default) {
            for (chunk in channel) {
                assembler.processChunk(chunk)
            }
        }

        launch(Dispatchers.IO) {
            capturer.start()
        }

        Platform.startup{
            val browserApp = BrowserApp(calculator)
            browserApp.start(Stage())
        }
    }
}
