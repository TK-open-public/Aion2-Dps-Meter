package com.tbread.webview

import com.prof18.rssparser.RssParser

object GitReleaseParser {
    private const val GITHUB_RSS_URL = "https://github.com/TK-open-public/Aion2-Dps-Meter/releases.atom"
    private var _currentVersion = ""

    var currentVersion: String
        get() = _currentVersion
        set(value) {
            _currentVersion = value
        }

    suspend fun parse() {
        val rssParser = RssParser()
        val rssChannel = rssParser.getRssChannel(GITHUB_RSS_URL)
        currentVersion = rssChannel.items[0].title ?: ""
    }
}