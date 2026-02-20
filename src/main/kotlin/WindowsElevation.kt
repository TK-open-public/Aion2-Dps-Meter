package com.tbread

import com.sun.jna.platform.win32.Shell32
import com.sun.jna.platform.win32.WinUser
import org.slf4j.LoggerFactory
import kotlin.system.exitProcess

object WindowsElevation {
    private val logger = LoggerFactory.getLogger(WindowsElevation::class.java)
    private const val ELEVATION_MARKER_ARG = "--elevated-launch"

    fun ensureRunAsAdminOrRelaunch(args: Array<String>) {
        if (!isWindows()) return
        if (args.any { it == ELEVATION_MARKER_ARG }) return

        val launcherPath = System.getProperty("jpackage.app-path")?.takeIf { it.isNotBlank() }
        if (launcherPath == null) {
            logger.warn("관리자 권한 자동 재실행 스킵: jpackage.app-path 미탐지")
            return
        }

        val relaunchArgs = args.filterNot { it == ELEVATION_MARKER_ARG } + ELEVATION_MARKER_ARG
        val parameters = buildCommandLine(relaunchArgs.toTypedArray()).ifBlank { ELEVATION_MARKER_ARG }
        Shell32.INSTANCE.ShellExecute(
            null,
            "runas",
            launcherPath,
            parameters,
            null,
            WinUser.SW_SHOWNORMAL
        )
        exitProcess(0)
    }

    private fun isWindows(): Boolean {
        return System.getProperty("os.name").contains("Windows", ignoreCase = true)
    }

    private fun buildCommandLine(args: Array<String>): String {
        return args.joinToString(" ") { quoteWindowsArg(it) }
    }

    // Windows CreateProcess 규칙에 맞춰 인자를 재구성한다.
    private fun quoteWindowsArg(value: String): String {
        if (value.isEmpty()) return "\"\""
        val needsQuotes = value.any { it.isWhitespace() || it == '"' }
        if (!needsQuotes) return value

        val escaped = StringBuilder()
        var backslashes = 0
        value.forEach { ch ->
            when (ch) {
                '\\' -> backslashes += 1
                '"' -> {
                    escaped.append("\\".repeat(backslashes * 2 + 1))
                    escaped.append('"')
                    backslashes = 0
                }
                else -> {
                    if (backslashes > 0) {
                        escaped.append("\\".repeat(backslashes))
                        backslashes = 0
                    }
                    escaped.append(ch)
                }
            }
        }

        if (backslashes > 0) {
            escaped.append("\\".repeat(backslashes * 2))
        }
        return "\"$escaped\""
    }
}
