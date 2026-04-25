from pathlib import Path
p = Path('index.html')
s = p.read_text(encoding='utf-8')
repls = {
    '<span class="hero-stat-num" id="stat-packages">11</span>': '<span class="hero-stat-num" id="stat-packages">12</span>',
    '<span class="hero-stat-num" id="stat-days">30</span>': '<span class="hero-stat-num" id="stat-days">63</span>',
    '<span class="dashboard-big-num" id="dl-total">6,963</span>': '<span class="dashboard-big-num" id="dl-total">14,038</span>',
    '<span class="dashboard-label">total downloads across 11 packages</span>': '<span class="dashboard-label">total downloads across 12 live packages</span>',
    '<span class="hire-stat-num">11</span>\n          <span class="hire-stat-label">npm packages</span>': '<span class="hire-stat-num">12</span>\n          <span class="hire-stat-label">live npm packages</span>',
}
for a,b in repls.items():
    s = s.replace(a,b)
start = s.index('        <div class="downloads-grid" id="downloads-grid">')
end = s.index('        </div>\n      </div>\n    </div>\n  </section>', start) + len('        </div>')
packages = [
    ('@darksol/terminal','v0.17.0','7,372'),
    ('darksol','v0.5.0','1,304'),
    ('gpu-orchestrator','v0.8.0','1,231'),
    ('context-kernel','v0.6.0','1,023'),
    ('llm-cost-guard','v1.5.0','752'),
    ('ipfs-bootstrap','v0.2.1','579'),
    ('@darksol/remem','v0.6.1','471'),
    ('@darksol/bankr-router','v1.2.2','348'),
    ('@darksol/portguard','v2.0.0','333'),
    ('openapi-mock-darksol','v0.2.2','226'),
    ('@darksol/agent-proofchain','v0.1.2','202'),
    ('@darksol/logpilot','v1.0.2','197'),
]
block = ['        <div class="downloads-grid" id="downloads-grid">']
for name, ver, dl in packages:
    block.append(f'''          <div class="dl-card">\n            <div class="dl-name">{name}</div>\n            <div class="dl-version">{ver}</div>\n            <div class="dl-weekly">{dl}</div>\n            <div class="dl-label">total downloads</div>\n          </div>''')
block.append('        </div>')
s = s[:start] + '\n'.join(block) + s[end:]
# Project card touchups
s = s.replace('Distributes inference and training jobs across hardware. 56 tests.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">v0.8.0</span>', 'Distributes inference and training jobs across hardware. 131 tests.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">v0.8.0</span>')
s = s.replace('Local classifier that tags each turn and routes to the optimal model. Smart dispatch, zero waste.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">routing</span>', 'Local classifier that tags each turn and routes to the optimal model. Smart dispatch, zero waste.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">v0.6.0</span>')
s = s.replace('Port conflict detection and management for development environments. Finds what\'s hogging your ports.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">devtools</span>', 'Port conflict detection and management for development environments. Finds what\'s hogging your ports.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">v2.0.0</span>')
insert_after = '''        <div class="project-card fade-in" data-tags="active infra">\n          <div class="project-status active-badge">ACTIVE</div>\n          <h3>LLM Cost Guard</h3>\n          <p>Token usage monitoring and cost enforcement for LLM pipelines. Budget caps and spend tracking across providers.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">cost</span>\n          </div>\n          <a href="https://www.npmjs.com/package/llm-cost-guard" target="_blank" class="project-link">npm ↗</a>\n        </div>'''
remem_card = '''        <div class="project-card fade-in" data-tags="active infra">\n          <div class="project-status active-badge">ACTIVE</div>\n          <h3>ReMEM</h3>\n          <p>Recursive memory substrate for AI agents. Layered episodic, semantic, identity, and procedural memory with compression and capture pipelines.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">v0.6.1</span>\n          </div>\n          <a href="https://www.npmjs.com/package/@darksol/remem" target="_blank" class="project-link">npm ↗</a>\n        </div>'''
if '@darksol/remem' not in s[s.index('<section id="projects"'):s.index('<!-- Services -->')]:
    s = s.replace(insert_after, insert_after + '\n\n' + remem_card)
# Remove unpublished archived package card for darksol-acp from npm section wording, make it service hub link instead
s = s.replace('<div class="project-status archived-badge">ARCHIVED</div>\n          <h3>DARKSOL ACP</h3>\n          <p>Agent Commerce Protocol service hub. Context compression, intent routing, vision analysis via local models.</p>\n          <div class="project-meta">\n            <span class="pm-tag">npm</span><span class="pm-tag">agents</span>\n          </div>\n          <a href="https://www.npmjs.com/package/darksol-acp" target="_blank" class="project-link">npm ↗</a>', '<div class="project-status live">LIVE</div>\n          <h3>DARKSOL ACP</h3>\n          <p>Agent Commerce Protocol service hub for cards, oracle, receipts, policies, and service APIs.</p>\n          <div class="project-meta">\n            <span class="pm-tag">service</span><span class="pm-tag">agents</span>\n          </div>\n          <a href="https://acp.darksol.net" target="_blank" class="project-link">acp.darksol.net ↗</a>')
p.write_text(s, encoding='utf-8')
print('patched npm stats and hero stats')
