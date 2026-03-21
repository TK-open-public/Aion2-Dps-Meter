package com.tbread

import com.tbread.config.PcapCapturerConfig
import com.tbread.config.VersionConfig
import com.tbread.data.DataManager
import com.tbread.packet.PacketAlignmenter
import com.tbread.packet.PcapCapturer
import com.tbread.packet.StreamAssembler
import com.tbread.packet.StreamProcessor
import com.tbread.webview.BrowserApp
import javafx.application.Platform
import javafx.stage.Stage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    Thread.setDefaultUncaughtExceptionHandler { t, e ->
        println("thread dead ${t.name}")
        e.printStackTrace()
    }

    DataManager.load()

    val channel = Channel<Triple<String,Long,ByteArray>>(Channel.UNLIMITED)
    val pcapConfig = PcapCapturerConfig.loadFromProperties()
    val versionConfig = VersionConfig.loadFromProperties()


    val processor = StreamProcessor()
    val alignmenter = PacketAlignmenter()
    val assembler = StreamAssembler(processor)
    val capturer = PcapCapturer(pcapConfig, channel)
    val calculator = DpsCalculator()

    launch(Dispatchers.Default) {
        var currentIp = ""
        for ((ip, seq, data) in channel) {
            if (ip != currentIp) {
                currentIp = ip
                alignmenter.reset()
            }
            val chunks = alignmenter.feed(seq, data)
            for (chunk in chunks) {
                assembler.processChunk(chunk)
            }
        }
    }

    launch(Dispatchers.IO) {
        capturer.start()
    }

    launch {
        while (true) {
            delay(1000)
            DataManager.checkDummyTimeout()
        }
    }


    Platform.startup {
        val browserApp = BrowserApp(versionConfig,calculator)
        browserApp.start(Stage())
    }
}


