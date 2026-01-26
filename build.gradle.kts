import org.jetbrains.compose.desktop.application.dsl.TargetFormat

plugins {
    kotlin("jvm")
    id("org.jetbrains.compose")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization") version "2.3.0"
    id("org.openjfx.javafxplugin") version "0.1.0"
}


group = "com.tbread"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
    google()
}

dependencies {
    // Note, if you develop a library, you should use compose.desktop.common.
    // compose.desktop.currentOs should be used in launcher-sourceSet
    // (in a separate module for demo project and in testMain).
    // With compose.desktop.common you will also lose @Preview functionality
    implementation(compose.desktop.currentOs)
    implementation ("org.pcap4j:pcap4j-core:1.8.2")
    implementation ("org.pcap4j:pcap4j-packetfactory-static:1.8.2")
    implementation ("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.10.2")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
    implementation("io.github.oshai:kotlin-logging-jvm:7.0.14")
    implementation("ch.qos.logback:logback-classic:1.5.25")
    implementation("com.prof18.rssparser:rssparser:6.1.2")
}

compose.desktop {
    application {
        mainClass = "com.tbread.MainKt"

        nativeDistributions {
            windows{
                includeAllModules = true
            }
            targetFormats(TargetFormat.Msi)
            packageName = "aion2meter4j"
            packageVersion = "0.2.4"
            copyright = "Copyright 2026 TK open public Licensed under MIT License"
        }
    }
}

javafx {
    version = "21.0.9:win"
    modules(
        "javafx.base",
        "javafx.graphics",
        "javafx.web")
}
