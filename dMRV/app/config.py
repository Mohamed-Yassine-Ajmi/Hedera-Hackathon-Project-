"""
ClimateTrust dMRV Pipeline Configuration & Methodology Coefficients
Version: 1.0.0-mediterranean

NOTE ON COEFFICIENTS:
The biological conversion coefficients below (a, b, c, d) are illustrative empirical
parameters calibrated for Mediterranean cork oak, cedar, and agroforestry ecosystems
(VM0007 / VM0042 standards). In production, methodology coefficients are formally
stipulated by Verra/Gold Standard Project Design Documents (PDD) and verified by accredited auditors.
"""

# Pipeline version and settings

# Micro-service host & port
HOST: str = "0.0.0.0"
PORT: int = 8001
PIPELINE_VERSION: str = "1.0.0-mediterranean"

# STAC Endpoint for Sentinel-2 L2A (Microsoft Planetary Computer)
PLANETARY_COMPUTER_STAC_URL: str = "https://planetarycomputer.microsoft.com/api/stac/v1"
SENTINEL_COLLECTION: str = "sentinel-2-l2a"
MAX_CLOUD_COVER_PCT: float = 30.0

# -------------------------------------------------------------------------
# BIOMASS CONVERSION CHAIN COEFFICIENTS (Illustrative VM0007 Parameters)
# -------------------------------------------------------------------------
# Step 1: Leaf Area Index (LAI) from NDVI: LAI = a * exp(b * NDVI)
COEFF_A: float = 0.42
COEFF_B: float = 3.15

# Step 2: Above-Ground Biomass (AGB in tonnes/ha) from LAI: AGB_t_ha = c * (LAI ** d)
COEFF_C: float = 14.80
COEFF_D: float = 1.22

# Step 3: Carbon stock fraction (IPCC standard carbon fraction of dry matter = 0.47)
# Carbon (tonnes C) = AGB_t_ha * area_ha * 0.47
CARBON_FRACTION: float = 0.47

# Step 4: Molecular conversion from Carbon to CO2 equivalent (ratio of molecular weights 44/12)
# tCO2e = Carbon * (44 / 12) = Carbon * 3.6667
CO2_TO_C_RATIO: float = 44.0 / 12.0
