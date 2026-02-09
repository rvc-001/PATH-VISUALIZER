import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from itertools import combinations

# --- Page Config ---
st.set_page_config(page_title="Orbital Mission Control", layout="wide")

# Custom CSS for Professional Report UI
st.markdown("""
<style>
    .stApp { background-color: #0e1117; }
    
    /* Scientific Header Style */
    h1 { 
        color: #FFFFFF; 
        font-family: 'Arial', sans-serif; 
        font-weight: bold; 
        letter-spacing: 1px;
        text-align: center;
        margin-bottom: 25px;
        text-transform: uppercase;
    }
    
    h2, h3 { color: #E0E0E0; font-family: 'Arial', sans-serif; }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #111827;
        border-right: 1px solid #374151;
    }
    
    /* Professional Button Styling */
    .stButton>button { 
        width: 100%; 
        border-radius: 4px; 
        font-weight: 600; 
        background-color: #2563eb; 
        color: white; 
        border: 1px solid #1d4ed8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .stButton>button:hover {
        background-color: #1d4ed8;
    }

    /* Clean Tabs */
    .stTabs [data-baseweb="tab-list"] { gap: 10px; justify-content: center; }
    .stTabs [data-baseweb="tab"] { 
        padding: 10px 20px;
        background-color: #1f2937; 
        border-radius: 4px; 
        color: #9ca3af;
        border: 1px solid #374151;
        font-weight: 500;
    }
    .stTabs [aria-selected="true"] { 
        background-color: #2563eb; 
        color: white; 
        border-color: #2563eb;
    }
</style>
""", unsafe_allow_html=True)

st.title("Orbital Mission Control System")

# --- 1. Physics Engine ---
class Satellite:
    def __init__(self, name, radius, speed, inclination, phase):
        self.name = name
        self.r = radius
        self.w = speed
        self.inc = np.radians(inclination)
        self.inc_deg = inclination
        self.phase = phase

    def position(self, t):
        theta = self.w * t + self.phase
        x = self.r * np.cos(theta)
        y_flat = self.r * np.sin(theta)
        y = y_flat * np.cos(self.inc)
        z = y_flat * np.sin(self.inc)
        return np.array([x, y, z])

    def get_lat_lon(self, t):
        pos = self.position(t)
        r = np.linalg.norm(pos)
        lat = np.degrees(np.arcsin(pos[2] / r))
        lon = np.degrees(np.arctan2(pos[1], pos[0]))
        return lat, lon

# --- 2. Configuration ---
EARTH_RADIUS = 6.0

if "sat_list" not in st.session_state:
    st.session_state.sat_list = [
        Satellite("SAT-LEO-01", EARTH_RADIUS + 1.0, 0.15, 45.0, 0.0),
        Satellite("SAT-POLAR-02", EARTH_RADIUS + 1.5, 0.12, 90.0, 2.0),
        Satellite("SAT-GEO-03", EARTH_RADIUS + 2.5, 0.08, 0.0, 4.0),
        Satellite("SAT-MEO-04", EARTH_RADIUS + 6.0, 0.05, 30.0, 1.0)
    ]

# --- 3. Sidebar ---
with st.sidebar:
    st.header("Configuration")
    
    with st.form("add_sat_form"):
        st.subheader("New Satellite Parameters")
        c1, c2 = st.columns(2)
        new_name = c1.text_input("ID/Name", value=f"SAT-{len(st.session_state.sat_list)+1:02d}")
        new_r = c2.number_input("Altitude (km scale)", value=8.0, min_value=6.5, max_value=40.0, step=0.5)
        c3, c4 = st.columns(2)
        new_v = c3.number_input("Velocity Factor", value=0.1, min_value=0.01, max_value=0.5, step=0.01)
        new_inc = c4.number_input("Inclination (deg)", value=15.0, min_value=0.0, max_value=180.0, step=5.0)
        
        if st.form_submit_button("Initialize Satellite"):
            st.session_state.sat_list.append(Satellite(new_name, new_r, new_v, new_inc, 0.0))
            st.rerun()

    if len(st.session_state.sat_list) > 0:
        st.markdown("---")
        sat_to_remove = st.selectbox("Select Satellite to Deorbit", [s.name for s in st.session_state.sat_list])
        if st.button("Remove Selected"):
            st.session_state.sat_list = [s for s in st.session_state.sat_list if s.name != sat_to_remove]
            st.rerun()

    sim_duration = st.slider("Simulation Window", 10.0, 50.0, 20.0)
    
# --- 4. Main Dashboard Tabs ---
tab1, tab2 = st.tabs(["3D Visualization", "Mission Analytics"])

# ==========================================
# TAB 1: 3D Visualization
# ==========================================
with tab1:
    t_steps = np.linspace(0, sim_duration, 60) 
    fig = go.Figure()

    # Earth Surface
    phi, theta = np.mgrid[0.0:2.0*np.pi:30j, 0.0:np.pi:15j]
    x_e = EARTH_RADIUS * np.sin(theta) * np.cos(phi)
    y_e = EARTH_RADIUS * np.sin(theta) * np.sin(phi)
    z_e = EARTH_RADIUS * np.cos(theta)

    fig.add_trace(go.Surface(
        x=x_e, y=y_e, z=z_e, 
        colorscale='earth', 
        showscale=False, 
        lighting=dict(ambient=0.5, diffuse=0.5, roughness=0.5), 
        hoverinfo='skip',
        name="Earth Surface"
    ))

    # Starfield (Visible in background)
    star_r = np.random.uniform(20, 35, 1000) 
    sx = star_r * np.sin(np.random.uniform(0, np.pi, 1000)) * np.cos(np.random.uniform(0, 2*np.pi, 1000))
    sy = star_r * np.sin(np.random.uniform(0, np.pi, 1000)) * np.sin(np.random.uniform(0, 2*np.pi, 1000))
    sz = star_r * np.cos(np.random.uniform(0, np.pi, 1000))
    fig.add_trace(go.Scatter3d(x=sx, y=sy, z=sz, mode='markers', marker=dict(size=1.5, color='white', opacity=0.7), hoverinfo='skip', name="Background Stars"))

    # Satellites & Trails
    sat_marker_indices = []
    view_limit = 30.0 
    
    for sat in st.session_state.sat_list:
        # Orbital Path
        trail_t = np.linspace(0, 2 * np.pi / sat.w * 2, 80)
        trail_pos = np.array([sat.position(t) for t in trail_t])
        fig.add_trace(go.Scatter3d(
            x=trail_pos[:,0], y=trail_pos[:,1], z=trail_pos[:,2], 
            mode='lines', 
            line=dict(color='gold', width=2), 
            opacity=0.6, 
            name=f"{sat.name} Track"
        ))
        
        # Current Position Marker
        pos = sat.position(0)
        fig.add_trace(go.Scatter3d(
            x=[pos[0]], y=[pos[1]], z=[pos[2]], 
            mode='markers+text', 
            marker=dict(size=8, color='red', symbol='diamond'), 
            text=f" {sat.name}", 
            textposition="top right", 
            textfont=dict(color="white", size=10)
        ))
        sat_marker_indices.append(len(fig.data) - 1)

    # Animation Frames
    frames = []
    for k, t in enumerate(t_steps):
        frame_data = []
        for sat in st.session_state.sat_list:
            pos = sat.position(t)
            frame_data.append(go.Scatter3d(
                x=[pos[0]], y=[pos[1]], z=[pos[2]], 
                mode='markers+text', 
                text=f" {sat.name}"
            ))
        frames.append(go.Frame(data=frame_data, traces=sat_marker_indices, name=str(k)))
    fig.frames = frames

    # Layout
    fig.update_layout(
        scene=dict(
            xaxis=dict(visible=False, range=[-view_limit, view_limit]), 
            yaxis=dict(visible=False, range=[-view_limit, view_limit]), 
            zaxis=dict(visible=False, range=[-view_limit, view_limit]), 
            aspectmode='cube', 
            bgcolor='black',
            # --- STARTING ZOOM FIX ---
            # Closer 'eye' values = More Zoomed In.
            # Normal is ~1.25. We use ~0.35 to zoom tight on the Earth.
            camera=dict(eye=dict(x=0.35, y=0.35, z=0.2))
        ),
        # Locks the camera so it doesn't reset when playing
        uirevision='constant',
        
        paper_bgcolor='#0e1117',
        margin=dict(l=0, r=0, b=0, t=0),
        height=700,

        # Control Bar (Only Play/Pause)
        updatemenus=[
            dict(
                type="buttons",
                direction="left",
                x=0.5, y=0.05,
                xanchor="center", yanchor="top",
                showactive=False,
                bgcolor="#1f2937",
                bordercolor="#374151",
                borderwidth=1,
                pad={"t": 8, "b": 8, "r": 8, "l": 8},
                font=dict(color="white", size=12, family="Arial"),
                buttons=[
                    dict(
                        label="PLAY SIMULATION",
                        method="animate",
                        args=[None, dict(frame=dict(duration=50, redraw=True), fromcurrent=True, mode='immediate')]
                    ),
                    dict(
                        label="PAUSE",
                        method="animate",
                        args=[[None], dict(frame=dict(duration=0, redraw=False), mode='immediate', transition=dict(duration=0))]
                    )
                ]
            )
        ]
        # Sliders removed
    )
    
    st.plotly_chart(fig, width="stretch")

# ==========================================
# TAB 2: Analytics
# ==========================================
with tab2:
    st.header("Mission Data Analytics")
    col_a, col_b = st.columns(2)

    # --- PLOT 1: Ground Tracks ---
    with col_a:
        st.subheader("Ground Track Projection")
        track_data = []
        track_times = np.linspace(0, 50, 200)
        
        for sat in st.session_state.sat_list:
            lats, lons = [], []
            for t in track_times:
                la, lo = sat.get_lat_lon(t)
                lats.append(la)
                lons.append(lo)
            track_data.append(pd.DataFrame({"Lat": lats, "Lon": lons, "Satellite": sat.name}))
            
        if track_data:
            df_tracks = pd.concat(track_data)
            fig_geo = px.scatter_geo(
                df_tracks, lat="Lat", lon="Lon", color="Satellite", 
                projection="orthographic",
                title="Projected Orbital Paths"
            )
            fig_geo.update_geos(bgcolor="#0e1117", showcountries=True, countrycolor="gray", showocean=True, oceancolor="#111")
            fig_geo.update_layout(paper_bgcolor="#0e1117", font_color="white", height=400, margin=dict(l=0, r=0, t=30, b=0))
            st.plotly_chart(fig_geo, use_container_width=True)

    # --- PLOT 2: Orbit Stats ---
    with col_b:
        st.subheader("Orbital Parameters")
        if st.session_state.sat_list:
            data = []
            for sat in st.session_state.sat_list:
                data.append({
                    "Name": sat.name,
                    "Altitude": sat.r - EARTH_RADIUS,
                    "Velocity": sat.w,
                    "Inclination": sat.inc_deg
                })
            df_stats = pd.DataFrame(data)
            
            fig_stats = px.scatter(
                df_stats, x="Altitude", y="Inclination", 
                size="Velocity", color="Name",
                size_max=30, hover_data=["Velocity"],
                title="Altitude vs. Inclination (Marker Size = Velocity)"
            )
            fig_stats.update_layout(
                paper_bgcolor="#0e1117", plot_bgcolor="#1f2937", font_color="white", height=400,
                xaxis=dict(title="Altitude (Earth Radii)", gridcolor="#444"),
                yaxis=dict(title="Inclination (Degrees)", gridcolor="#444")
            )
            st.plotly_chart(fig_stats, use_container_width=True)

    # --- PLOT 3: Collision Radar ---
    st.subheader("Conjunction Analysis (Separation Distance)")
    
    if len(st.session_state.sat_list) >= 2:
        pairs = list(combinations(st.session_state.sat_list, 2))
        t_check = np.linspace(0, sim_duration, 100)
        dist_history = []
        for p in pairs:
            sat1, sat2 = p
            dists = []
            for t in t_check:
                p1 = sat1.position(t)
                p2 = sat2.position(t)
                dists.append(np.linalg.norm(p1 - p2))
            
            pair_name = f"{sat1.name} vs {sat2.name}"
            for t, d in zip(t_check, dists):
                dist_history.append({"Time": t, "Distance": d, "Pair": pair_name})
        
        df_dist = pd.DataFrame(dist_history)
        fig_dist = px.line(df_dist, x="Time", y="Distance", color="Pair", title="Relative Separation Over Time")
        fig_dist.add_hline(y=1.0, line_dash="dash", line_color="red", annotation_text="Critical Threshold (<1.0)")
        fig_dist.update_layout(
            paper_bgcolor="#0e1117", plot_bgcolor="#1f2937", font_color="white", height=350,
            xaxis=dict(gridcolor="#444"), yaxis=dict(gridcolor="#444")
        )
        st.plotly_chart(fig_dist, use_container_width=True)
    else:
        st.info("Insufficient satellite data for conjunction analysis. Please add at least two satellites.")