from typing import List, Dict, Any, Tuple, Set
from collections import defaultdict, deque

class CyclicDependencyError(Exception):
    def __init__(self, message: str, cycle_nodes: List[str] = None):
        super().__init__(message)
        self.cycle_nodes = cycle_nodes or []

def build_graph(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Tuple[Dict[str, Set[str]], Dict[str, int], Dict[str, Dict[str, Any]]]:
    """
    Builds adjacency list and in-degree map from React Flow nodes and edges.
    Returns: (adj_list, in_degrees, nodes_map)
    """
    nodes_map = {n["id"]: n for n in nodes if "id" in n}
    adj_list: Dict[str, Set[str]] = defaultdict(set)
    in_degrees: Dict[str, int] = {node_id: 0 for node_id in nodes_map}

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source in nodes_map and target in nodes_map:
            # avoid duplicate edges counting toward in_degree multiple times
            if target not in adj_list[source]:
                adj_list[source].add(target)
                in_degrees[target] += 1

    return adj_list, in_degrees, nodes_map

def detect_cycles_and_toposort(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[List[str]]:
    """
    Kahn's Algorithm for topological sorting and cycle detection.
    Returns: execution levels (batches of node IDs that can run in parallel).
    Raises: CyclicDependencyError if graph contains a cycle.
    """
    if not nodes:
        return []

    adj_list, in_degrees, nodes_map = build_graph(nodes, edges)

    # Queue of nodes with in-degree 0
    queue = deque([node_id for node_id, degree in in_degrees.items() if degree == 0])
    levels: List[List[str]] = []
    visited_count = 0

    while queue:
        level_size = len(queue)
        current_level = []
        for _ in range(level_size):
            u = queue.popleft()
            current_level.append(u)
            visited_count += 1

            for v in adj_list[u]:
                in_degrees[v] -= 1
                if in_degrees[v] == 0:
                    queue.append(v)

        if current_level:
            levels.append(current_level)

    total_nodes = len(nodes_map)
    if visited_count < total_nodes:
        # Find nodes still having in-degree > 0 to identify nodes in or downstream of cycle
        cycle_nodes = [node_id for node_id, degree in in_degrees.items() if degree > 0]
        raise CyclicDependencyError(
            f"Цикл запрещён: в графе обнаружена циклическая зависимость (ноды: {', '.join(cycle_nodes)}).",
            cycle_nodes=cycle_nodes
        )

    return levels

def validate_graph(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates graph structure and returns diagnostics.
    """
    try:
        levels = detect_cycles_and_toposort(nodes, edges)
        return {
            "is_valid": True,
            "has_cycle": False,
            "levels": levels,
            "error": None,
            "cycle_nodes": []
        }
    except CyclicDependencyError as e:
        return {
            "is_valid": False,
            "has_cycle": True,
            "levels": [],
            "error": str(e),
            "cycle_nodes": e.cycle_nodes
        }
