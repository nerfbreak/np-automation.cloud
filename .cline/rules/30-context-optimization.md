# Context Optimization
- **Headroom**: Used for token compression of large contexts (e.g. build logs, large JSONs). Do not use Headroom memory as authoritative source of truth. Authoritative truth lives in Git and `.agents/` shared memory.
- **RTK**: Rust Token Killer is available for supported terminal commands. Use targeted raw commands when RTK masks critical stack traces or errors. 
- **Exact Evidence**: Never discard exact failure evidence (e.g., TS errors, test failures) if compression makes it ambiguous. Bypass compression to retrieve raw evidence when needed.