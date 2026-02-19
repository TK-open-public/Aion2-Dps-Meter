pluginManagement {
    val kotlinVersion = providers.gradleProperty("kotlin.version").orElse("2.0.0").get()
    val composeVersion = providers.gradleProperty("compose.version").orElse("1.6.11").get()

    repositories {
        maven {
            url = java.net.URI.create("https://maven.pkg.jetbrains.space/public/p/compose/dev")
        }
        google()
        gradlePluginPortal()
        mavenCentral()
    }

    plugins {
        id("org.jetbrains.kotlin.jvm") version kotlinVersion
        id("org.jetbrains.compose") version composeVersion
        id("org.jetbrains.kotlin.plugin.compose") version kotlinVersion
    }
}

rootProject.name = "aion2meter4j"
