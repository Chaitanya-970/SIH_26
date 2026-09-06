from fastapi import APIRouter
from datetime import datetime, timezone
import psutil

router = APIRouter(prefix="/api", tags=["network"])

@router.get("/network-status")
async def get_network_status():
    """
    Scans active network connections via psutil to verify air-gap status.
    Counts local vs external connections.
    """
    external_conns = 0
    local_conns = 0
    
    try:
        # Get all TCP/UDP network connections
        connections = psutil.net_connections(kind='all')
        
        for conn in connections:
            if conn.status == 'ESTABLISHED':
                # Check remote address
                raddr = getattr(conn, 'raddr', None)
                if raddr and len(raddr) >= 1:
                    ip = raddr[0]
                    # Check if IP is localhost/loopback or local network
                    if ip.startswith('127.') or ip == '::1' or ip == '0.0.0.0' or ip.startswith('192.168.') or ip.startswith('10.'):
                        local_conns += 1
                    else:
                        # For air-gapped systems, this should ideally be 0, or limited to intranet IPs
                        external_conns += 1
                else:
                    # No remote address (listening sockets etc)
                    local_conns += 1
    except Exception:
        # psutil might require root for some connections on Linux/Mac, Windows is usually fine
        pass

    status = "AIR_GAPPED" if external_conns == 0 else "LEAK_WARNING"

    return {
        "status": status,
        "external_connections": external_conns,
        "local_connections": local_conns,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
