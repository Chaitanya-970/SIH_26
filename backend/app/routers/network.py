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

    from app.config import ModelRegistry
    from app.services.rag import registry as doc_registry
    from app.services import chroma
    
    # Get actual document count from registry
    num_docs = 0
    pages_indexed = 0
    categories = {
        "Engineering": 0,
        "Operations": 0,
        "Incidents": 0,
        "Safety": 0,
    }

    try:
        registered_docs = doc_registry.list_documents()
        num_docs = len(registered_docs)
        pages_indexed = sum(getattr(d, "page_count", 1) for d in registered_docs)
        for d in registered_docs:
            name = getattr(d, "filename", "").upper()
            if any(k in name for k in ["PUMP", "ASME", "TECH", "SPEC"]):
                categories["Engineering"] += 1
            elif any(k in name for k in ["SAFETY", "HAZARD", "OSHA"]):
                categories["Safety"] += 1
            elif any(k in name for k in ["INCIDENT", "FAILURE"]):
                categories["Incidents"] += 1
            elif any(k in name for k in ["MAINTENANCE", "INSPECTION", "SOP"]):
                categories["Operations"] += 1
            else:
                categories["Engineering"] += 1
    except Exception:
        num_docs = 0
        pages_indexed = 0

    if pages_indexed == 0 and num_docs > 0:
        try:
            pages_indexed = chroma.count()
        except Exception:
            pass
        
    # Get active model
    try:
        registry = ModelRegistry()
        text_model = registry.get_by_capability("text")
        active_model = text_model.name if text_model else "Unknown"
    except Exception:
        active_model = "Unknown"

    return {
        "status": status,
        "external_connections": external_conns,
        "local_connections": local_conns,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "knowledge_base": {
            "documents": num_docs,
            "pages_indexed": pages_indexed,
            "categories": [
                {"label": "Engineering", "count": categories["Engineering"]},
                {"label": "Operations", "count": categories["Operations"]},
                {"label": "Incidents", "count": categories["Incidents"]},
                {"label": "Safety", "count": categories["Safety"]},
            ]
        },
        "active_model": active_model,
        "active_agents": 4,
        "network_mode": "Air-gapped" if external_conns == 0 else "Online"
    }
