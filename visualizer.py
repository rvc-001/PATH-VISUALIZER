import plotly.graph_objects as go
import numpy as np
from orbit import Satellite

# --- 1. Configuration (Matching the "Perfect" App Settings) ---
EARTH_RADIUS = 6.0
SIM_DURATION = 15.0  # Seconds of animation
FRAMES = 90         # Total frames (smoothness)
ZOOM_LEVEL = 1.2    # Cinematic zoom

print(f"🚀 Initializing Orbital Visualizer...")
print(f"🌍 Physics: 3D | Earth Radius: {EARTH_RADIUS}")

# --- 2. Initialize Satellites ---
# We use the same 'real' mix of orbits: LEO, Polar, Equatorial, MEO
satellites = [
    Satellite("Sat-1 (LEO)", EARTH_RADIUS + 1.0, 0.15, 45.0, 0.0),
    Satellite("Sat-2 (Polar)", EARTH_RADIUS + 1.5, 0.12, 90.0, 2.0),
    Satellite("Sat-3 (Eq)", EARTH_RADIUS + 2.5, 0.08, 0.0, 4.0),
    Satellite("Sat-4 (MEO)", EARTH_RADIUS + 6.0, 0.05, 30.0, 1.0)
]

# --- 3. Build 3D Scene ---
t_steps = np.linspace(0, SIM_DURATION, FRAMES)
fig = go.Figure()

# A. Earth Sphere
phi, theta = np.mgrid[0.0:2.0*np.pi:30j, 0.0:np.pi:15j]
x_e = EARTH_RADIUS * np.sin(theta) * np.cos(phi)
y_e = EARTH_RADIUS * np.sin(theta) * np.sin(phi)
z_e = EARTH_RADIUS * np.cos(theta)

fig.add_trace(go.Surface(
    x=x_e, y=y_e, z=z_e,
    colorscale='earth',
    showscale=False,
    lighting=dict(ambient=0.5, diffuse=0.5, roughness=0.5, specular=0.2),
    name='Earth'
))

# B. Starfield
# Placed carefully so they look deep but fit in the view
star_r = np.random.uniform(25, 60, 1500)
star_theta = np.random.uniform(0, np.pi, 1500)
star_phi = np.random.uniform(0, 2*np.pi, 1500)

sx = star_r * np.sin(star_theta) * np.cos(star_phi)
sy = star_r * np.sin(star_theta) * np.sin(star_phi)
sz = star_r * np.cos(star_theta)

fig.add_trace(go.Scatter3d(
    x=sx, y=sy, z=sz,
    mode='markers',
    marker=dict(size=2, color='white', opacity=0.7),
    hoverinfo='skip',
    name='Stars'
))

# C. Satellites & Trails
sat_marker_indices = []

for sat in satellites:
    # Static Trail
    trail_t = np.linspace(0, 2 * np.pi / sat.w * 2, 80)
    trail_pos = np.array([sat.position(t) for t in trail_t])
    fig.add_trace(go.Scatter3d(
        x=trail_pos[:,0], y=trail_pos[:,1], z=trail_pos[:,2],
        mode='lines',
        line=dict(color='gold', width=3),
        opacity=0.5,
        name=f"{sat.name} Path"
    ))
    
    # Dynamic Marker (Initial Position)
    pos = sat.position(0)
    fig.add_trace(go.Scatter3d(
        x=[pos[0]], y=[pos[1]], z=[pos[2]],
        mode='markers+text',
        marker=dict(size=10, color='red', symbol='diamond'),
        text=f" {sat.name}",
        textposition="top right",
        textfont=dict(color="white", size=12, family="Arial Black"),
        name=sat.name
    ))
    sat_marker_indices.append(len(fig.data) - 1)

# D. Animation Frames
frames = []
for k, t in enumerate(t_steps):
    frame_data = []
    for sat in satellites:
        pos = sat.position(t)
        frame_data.append(go.Scatter3d(
            x=[pos[0]], y=[pos[1]], z=[pos[2]],
            mode='markers+text',
            text=f" {sat.name}"
        ))
    frames.append(go.Frame(data=frame_data, traces=sat_marker_indices, name=str(k)))

fig.frames = frames

# --- 4. Final Layout ---
view_limit = 30.0
range_config = [-view_limit, view_limit]

fig.update_layout(
    title="Orbital Path Visualizer (Standalone Mode)",
    title_x=0.5,
    scene=dict(
        xaxis=dict(visible=False, range=range_config),
        yaxis=dict(visible=False, range=range_config),
        zaxis=dict(visible=False, range=range_config),
        aspectmode='cube',
        dragmode='turntable',
        bgcolor='black',
        camera=dict(eye=dict(x=0.6, y=0.6, z=0.3)) # Cinematic Zoom
    ),
    template="plotly_dark",
    margin=dict(l=0, r=0, b=0, t=40),
    updatemenus=[dict(
        type="buttons",
        showactive=False,
        x=0.5, y=0.05,
        xanchor="center",
        pad={"t": 20},
        buttons=[
            dict(label="▶ PLAY VIDEO", method="animate",
                 args=[None, dict(frame=dict(duration=50, redraw=True), fromcurrent=True, mode='immediate')]),
            dict(label="⏸ PAUSE", method="animate",
                 args=[[None], dict(frame=dict(duration=0, redraw=False), mode='immediate', transition=dict(duration=0))])
        ]
    )]
)

print("✅ Visualization generated! Opening in browser...")
fig.show()