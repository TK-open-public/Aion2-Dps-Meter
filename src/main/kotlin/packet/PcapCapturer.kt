package com.tbread.packet

import com.tbread.config.PcapCapturerConfig
import kotlinx.coroutines.channels.Channel
import org.pcap4j.core.BpfProgram
import org.pcap4j.core.PacketListener
import org.pcap4j.core.PcapNativeException;
import org.pcap4j.core.PcapNetworkInterface
import org.pcap4j.core.Pcaps
import org.pcap4j.packet.TcpPacket
import org.slf4j.LoggerFactory
import java.net.DatagramSocket
import java.net.InetAddress
import kotlin.system.exitProcess

class PcapCapturer(private val config: PcapCapturerConfig, private val channel: Channel<ByteArray>) {

    companion object {
        private val logger = LoggerFactory.getLogger(javaClass.enclosingClass)

        private fun getAllDevices(): List<PcapNetworkInterface> {
            return try {
                Pcaps.findAllDevs() ?: emptyList()
            } catch (e: PcapNativeException) {
                logger.error("Pcap 핸들러 초기화 실패",e)
                exitProcess(2)
            }
        }
    }

    private fun getMainDevice(ip: String): PcapNetworkInterface? {
        val devices = getAllDevices()
        for (device in devices) {
            for (addr in device.addresses) {
                if (addr.address != null) {
                    if (addr.address.hostAddress.equals(ip)) {
                        return device
                    }
                }
            }
        }
        logger.warn("네트워크 디바이스 검색 실패")
        return null
    }


    fun start() {
        val socket = DatagramSocket()
        socket.connect(InetAddress.getByName("8.8.8.8"), 10002);
        val ip = socket.localAddress.hostAddress
        if (ip == null) {
            logger.error("ip 검색에 실패했습니다.")
            exitProcess(1)
            //나중에 gui 연결후 어떻게할지 정리해서 처리
        }
        val nif = getMainDevice(ip)
        if (nif == null){
            logger.error("네트워크 디바이스 탐색에 실패했습니다.")
            exitProcess(1)
        }
        val handle = nif.openLive(config.snapshotSize, PcapNetworkInterface.PromiscuousMode.PROMISCUOUS, config.timeout)
        val filter = "src net ${config.serverIp} and port ${config.serverPort}"
        handle.setFilter(filter, BpfProgram.BpfCompileMode.OPTIMIZE)
        logger.info("패킷필터 설정 \"$filter\"")
        val listener = PacketListener { packet ->
            if (packet.contains(TcpPacket::class.java)) {
                val tcpPacket = packet.get(TcpPacket::class.java)
                val payload = tcpPacket.payload
                if (payload != null) {
                    val data = payload.rawData
                    if (data.isNotEmpty()) {
                        channel.trySend(data)
                    }
                }
            }
        }
        try {
            handle.use { h ->
                h.loop(-1, listener)
            }
        } catch (e: InterruptedException) {
            logger.error("채널 소비에서 문제가 발생했습니다.",e)
        }
    }


}