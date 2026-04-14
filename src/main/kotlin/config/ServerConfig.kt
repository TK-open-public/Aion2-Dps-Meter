package com.tbread.config

import org.slf4j.LoggerFactory
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.Properties

object ServerConfig {
    private val logger = LoggerFactory.getLogger(ServerConfig::class.java)
    private const val CONFIG_FILE = "server.properties"
    private const val SERVER_TYPE_KEY = "server.type"
    
    enum class ServerType {
        KOREA, 
        TAIWAN
    }
    
    private var serverType: ServerType = ServerType.KOREA
    
    init {
        loadFromProperties()
    }
    
    fun getServerType(): ServerType {
        return serverType
    }
    
    fun setServerType(type: ServerType) {
        serverType = type
        saveToProperties()
    }
    
    private fun loadFromProperties() {
        try {
            val file = File(CONFIG_FILE)
            if (file.exists()) {
                val properties = Properties()
                FileInputStream(file).use {
                    properties.load(it)
                }
                val typeStr = properties.getProperty(SERVER_TYPE_KEY, "KOREA")
                serverType = ServerType.valueOf(typeStr)
            }
        } catch (e: Exception) {
            logger.error("Failed to load server config", e)
        }
    }
    
    private fun saveToProperties() {
        try {
            val file = File(CONFIG_FILE)
            val properties = Properties()
            properties.setProperty(SERVER_TYPE_KEY, serverType.name)
            FileOutputStream(file).use {
                properties.store(it, "Server Configuration")
            }
        } catch (e: Exception) {
            logger.error("Failed to save server config", e)
        }
    }
    
    fun getMobJsonPath(): String {
        return when (serverType) {
            ServerType.KOREA -> "/json/mobs.json"
            ServerType.TAIWAN -> "/json/mobs_tw.json"
        }
    }
    
    fun getSkillJsonPath(): String {
        return when (serverType) {
            ServerType.KOREA -> "/json/skills.json"
            ServerType.TAIWAN -> "/json/skills_tw.json"
        }
    }
    
    fun getBuffJsonPath(): String {
        return when (serverType) {
            ServerType.KOREA -> "/json/buff.json"
            ServerType.TAIWAN -> "/json/buff_tw.json"
        }
    }
}