# Kuntur Threat Intelligence Dashboard

![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/kuntur/ci.yml?branch=main)
![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)
![Version](https://img.shields.io/badge/Version-2.0.0-green.svg)
![Node](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-brightgreen)

> Your own cyber threat intelligence terminal. 10 sources. One command. Zero cloud.

Kuntur is a **Cyber Threat Intelligence Dashboard** that monitors cybersecurity threats in real-time, with special focus on Bolivia. It integrates multiple threat intelligence sources to provide a complete view of the threat landscape, featuring a live web dashboard for real-time monitoring.

![Kuntur Dashboard](docs/images/dashboard-overview.png)

## Features

### Core Capabilities

- **10 Intelligence Sources** - Threat intelligence and contextual data sources
- **Live Dashboard** - Real-time web interface for monitoring threats
- **Parallel Execution** - All sources queried simultaneously for speed
- **Robust Error Handling** - Single source failure doesn't stop the briefing
- **Bolivia Focus** - Detection of threats involving Bolivia
- **Zero Cloud Dependencies** - Everything runs locally
- **Structured JSON Output** - Easy integration with other systems
- **MITRE ATT&CK Mapping** - Attack patterns mapped to MITRE techniques
- **RESTful API** - Programmatic access to intelligence data
- **Auto-refresh** - Configurable automatic updates

### Dashboard Features

- **Real-time Threat Visualization** - Interactive threat map and timeline
- **Severity-based Filtering** - Focus on critical and high-priority threats
- **Attack Type Classification** - Categorization by MITRE ATT&CK techniques
- **Geolocation Analysis** - Geographic distribution of threats
- **Source Health Monitoring** - Real-time status of all intelligence sources
- **Historical Data** - Track threat evolution over time

## Screenshots

### Dashboard Overview
![Dashboard](docs/images/dashboard-overview.png)

### Threat Details
![Threat Details](docs/images/threat-details.png)

### Attack Events Timeline
![Timeline](docs/images/timeline.png)

## Installation

### Prerequisites

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/kuntur.git
cd kuntur

# 2. Install dependencies
npm install

# 3. Configure API keys (optional)
cp .env.example .env
# Edit .env with your API keys

# 4. Start the dashboard server
npm start
```

The dashboard will be available at `http://localhost:3117`

### Docker Installation

```bash
# Build the image
docker build -t kuntur:latest .

# Run the container
docker run -d \
  --name kuntur \
  -p 3117:3117 \
  --env-file .env \
  kuntur:latest
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# === Server Configuration ===
PORT=3117
REFRESH_INTERVAL_MINUTES=15

# === Threat Intelligence API Keys ===

# AbuseIPDB - Get your key at: https://abuseipdb.com/account/api
ABUSEIPDB_API_KEY=your_key_here

# GreyNoise - Get your key at: https://greynoise.io/account
GREYNOISE_API_KEY=your_key_here

# OTX AlienVault - Get your key at: https://otx.alienvault.com/api
OTX_API_KEY=your_key_here

# Shodan - Get your key at: https://shodan.io/member/api
SHODAN_API_KEY=your_key_here

# Cloudflare Radar - Get token at: dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_API_TOKEN=your_token_here

# T-Pot Honeypot (Optional - local deployment)
TPOT_API_URL=http://localhost:64242
TPOT_API_KEY=your_key_here
```

### API Key Setup Guide

Detailed instructions for each provider: [docs/API-KEYS-SETUP.md](docs/API-KEYS-SETUP.md)

| API | Free Tier | Sign Up Link |
|-----|-----------|--------------|
| AbuseIPDB | 1,000 requests/day | [abuseipdb.com](https://abuseipdb.com) |
| GreyNoise | 50 requests/week | [greynoise.io](https://greynoise.io) |
| OTX | 20 requests/minute | [otx.alienvault.com](https://otx.alienvault.com) |
| Shodan | 100 requests/month | [shodan.io](https://shodan.io) |
| Cloudflare | Free | [dash.cloudflare.com](https://dash.cloudflare.com) |

## Usage

### Starting the Server

```bash
# Start the dashboard server
npm start

# Development mode with trace warnings
npm run dev

# Clean restart
npm run fresh-start
```

### CLI Commands

```bash
# Run full threat intelligence briefing
npm run kuntur

# Threat intelligence sources only (6 sources)
npm run kuntur:threat

# Contextual sources only (4 sources)
npm run kuntur:context

# Individual source execution
npm run kuntur:demo          # Demo replay (simulated data)
npm run kuntur:cisa          # CISA KEV vulnerabilities
npm run kuntur:abuseipdb     # Malicious IPs
npm run kuntur:greynoise     # Internet scanning IPs
npm run kuntur:otx           # OTX threat exchange
npm run kuntur:shodan        # Exposed devices
npm run kuntur:tpot          # T-Pot honeypot
```

### API Endpoints

Once the server is running, you can access:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `http://localhost:3117/` | GET | Dashboard web interface |
| `http://localhost:3117/api/status` | GET | System status and health |
| `http://localhost:3117/api/briefing` | GET | Full intelligence briefing |
| `http://localhost:3117/api/threats` | GET | Threat intelligence data |
| `http://localhost:3117/api/context` | GET | Contextual data |
| `http://localhost:3117/api/events` | GET | Attack events data |

### Example API Response

```json
{
  "kuntur": {
    "version": "2.0.0",
    "timestamp": "2026-07-05T12:00:00Z",
    "totalDurationMs": 5000,
    "sourcesQueried": 10,
    "sourcesOk": 7,
    "sourcesConfigured": 5,
    "sourcesUnconfigured": 2,
    "sourcesFailed": 0
  },
  "intelligence": {
    "signals": [
      {
        "severity": "critical",
        "title": "Critical Threats Detected",
        "description": "3 critical attack events detected"
      }
    ],
    "attack_events": {
      "total_events": 45,
      "bolivia_events": 3,
      "by_attack_type": {
        "brute_force": 12,
        "port_scan": 8,
        "malware_c2": 5
      },
      "by_severity": {
        "critical": 3,
        "high": 15,
        "medium": 20,
        "low": 7
      }
    },
    "context_data": {
      "cisa_vulnerabilities": 1631,
      "cisa_recent_additions": 23,
      "who_outbreaks": 5,
      "noaa_severe_alerts": 12
    }
  }
}
```

## Intelligence Sources

### Threat Intelligence Sources (6)

| Source | Description | API Key | Status |
|--------|-------------|---------|--------|
| **DemoReplay** | Simulated data for demos | Not needed | ✅ Always available |
| **T-Pot** | Honeypot T-Pot (local) | Optional | ⚠️ Requires installation |
| **AbuseIPDB** | Reported malicious IPs | Free | ✅ Requires key |
| **GreyNoise** | Internet scanning IPs | Free | ✅ Requires key |
| **OTX** | Community threat intel | Free | ✅ Requires key |
| **Shodan** | Exposed devices | Free | ✅ Requires key |

### Contextual Sources (4)

| Source | Description | API Key | Status |
|--------|-------------|---------|--------|
| **CISA-KEV** | Actively exploited vulnerabilities | No | ✅ Always available |
| **Cloudflare-Radar** | Internet outages & anomalies | Free | ⚠️ Requires key |
| **WHO** | Disease outbreaks | No | ✅ Always available |
| **NOAA/NWS** | Severe weather alerts (US) | No | ✅ Always available |

### Attack Types Detected

| Type | Description | MITRE ID |
|------|-------------|----------|
| `port_scan` | Port scanning | T1595 |
| `brute_force` | Brute force attack | T1110 |
| `malware_c2` | Malware/C2 | T1071 |
| `ddos` | DDoS attack | T1498 |
| `exploit_attempt` | Exploit attempt | T1190 |
| `recon` | Reconnaissance | T1590 |
| `exfiltration` | Data exfiltration | T1041 |
| `sql_injection` | SQL injection | T1190 |
| `web_attack` | Web attack | T1190 |
| `impersonation` | Impersonation | T1596 |

## Project Structure

```
kuntur/
├── apis/
│   ├── briefing.mjs              # Main orchestrator
│   ├── sources/
│   │   ├── demo-replay.mjs       # Simulated data
│   │   ├── cisa-kev.mjs          # CISA vulnerabilities
│   │   ├── abuseipdb.mjs         # Malicious IPs
│   │   ├── greynoise.mjs         # Internet scanning IPs
│   │   ├── otx.mjs               # Threat exchange
│   │   ├── shodan.mjs            # Exposed devices
│   │   ├── tpot.mjs              # Honeypot
│   │   ├── cloudflare-radar.mjs  # Internet outages
│   │   ├── who.mjs               # Disease outbreaks
│   │   └── noaa.mjs              # Weather alerts
│   └── utils/
│       ├── fetch.mjs             # HTTP utilities
│       └── env.mjs               # Environment variables
├── dashboard/
│   ├── inject.mjs                # Dashboard data injector
│   ├── kuntur-synth.mjs          # Kuntur synthesizer
│   └── public/                   # Static assets
├── docs/
│   └── API-KEYS-SETUP.md         # API keys guide
├── lib/
│   └── geoip/                    # GeoIP utilities
├── schemas/
│   └── attack-event.schema.json  # Event schema
├── scripts/
│   └── clean.mjs                 # Cleanup script
├── server.mjs                    # Main server
├── package.json
├── .env.example                  # Environment template
└── README.md
```

## Development

### Adding a New Intelligence Source

Each source should:

1. Export a `briefing()` function returning structured data
2. Handle upstream errors and rate limits cleanly
3. Degrade gracefully when API keys are missing
4. Not break the full sweep if it fails
5. Document required environment variables
6. Explain why it improves signal quality

### Source Template

```javascript
// apis/sources/your-source.mjs
export async function briefing(env) {
  const API_KEY = env.YOUR_API_KEY;

  if (!API_KEY) {
    return {
      source: 'YourSource',
      status: 'configured: false',
      data: null,
      error: 'API key not configured'
    };
  }

  try {
    const response = await fetch('https://api.example.com/data', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      source: 'YourSource',
      status: 'ok',
      data: processData(data),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      source: 'YourSource',
      status: 'error',
      data: null,
      error: error.message
    };
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guidelines

- Keep PRs focused and scoped
- Add new sources in `apis/sources/`
- Handle errors gracefully
- Update documentation for API keys
- Include screenshots for UI changes
- Follow AGPL-3.0 licensing
- Test your changes locally before submitting

### Contribution Areas

- **New Intelligence Sources** - Add additional threat intelligence feeds
- **Dashboard Improvements** - Enhance visualization and user experience
- **Bug Fixes** - Help identify and fix issues
- **Documentation** - Improve guides and API documentation
- **Testing** - Add test coverage for core functionality

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for the full license text.

### What AGPL-3.0 Means

- You are free to use, modify, and distribute this software
- Modifications must be open-sourced under the same license
- If you run it as a network service, users must be able to access the source
- This ensures the community benefits from improvements

## Acknowledgments

Kuntur integrates data from several excellent threat intelligence and data sources:

### Threat Intelligence Sources

- **[AbuseIPDB](https://abuseipdb.com/)** - Malicious IP address database
- **[GreyNoise](https://greynoise.io/)** - Internet scanning intelligence
- **[AlienVault OTX](https://otx.alienvault.com/)** - Open threat exchange
- **[Shodan](https://shodan.io/)** - Internet-connected devices search engine
- **[T-Pot](https://github.com/telekom-security/tpotce)** - Honeypot toolkit
- **[CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)** - Known exploited vulnerabilities catalog

### Contextual Sources

- **[Cloudflare Radar](https://radar.cloudflare.com/)** - Internet traffic and outages
- **[WHO](https://www.who.int/)** - World Health Organization data
- **[NOAA/NWS](https://www.weather.gov/)** - National Weather Service alerts

### MITRE ATT&CK

Attack type mapping uses the **[MITRE ATT&CK](https://attack.mitre.org/)** framework.

### Built With

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **AJV** - JSON schema validation
- **MaxMind GeoIP2** - IP geolocation

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/kuntur/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/kuntur/discussions)
- **Security**: See [SECURITY.md](SECURITY.md) for vulnerability reporting

## Roadmap

- [ ] Webhook notifications for critical threats
- [ ] Historical threat analysis
- [ ] Custom threat feed integrations
- [ ] Multi-language dashboard support
- [ ] Mobile dashboard view
- [ ] Threat correlation engine
- [ ] Machine learning-based threat prediction
- [ ] Community threat sharing network

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=yourusername/kuntur&type=date)](https://star-history.com/#yourusername/kuntur&Date)

---

**Made with ❤️ for the cybersecurity community**

*Kuntur - The Condor Soars High to Watch Over Your Digital Realm*
