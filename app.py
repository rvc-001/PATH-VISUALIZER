import streamlit as st
import matplotlib.pyplot as plt
from orbit import Satellite, check_close_approaches

st.set_page_config(page_title="Orbital Visualizer", layout="centered")
st.title("🪐 Orbital Path Visualizer + Collision Alert")

st.sidebar.header("Simulation Controls")

num_sats = st.sidebar.slider("Number of satellites", 2, 5, 3)
threshold = st.sidebar.slider("Collision threshold", 0.2, 2.0, 0.8)
t = st.sidebar.slider("Time", 0.0, 20.0, 0.0, step=0.1)

satellites = []

for i in range(num_sats):
    st.sidebar.subheader(f"Satellite {i+1}")
    r = st.sidebar.slider(f"Radius {i+1}", 2.0, 10.0, 4.0 + i)
    w = st.sidebar.slider(f"Angular velocity {i+1}", 0.1, 2.0, 0.5 + 0.1*i)
    satellites.append(Satellite(f"Sat-{i+1}", r, w))

fig, ax = plt.subplots()
ax.set_aspect("equal")
ax.set_xlim(-12, 12)
ax.set_ylim(-12, 12)

earth = plt.Circle((0, 0), 1, color="blue")
ax.add_patch(earth)

positions = []

for sat in satellites:
    pos = sat.position(t)
    positions.append(pos)
    ax.plot(pos[0], pos[1], "o", label=sat.name)

alerts = check_close_approaches(satellites, t, threshold)

if alerts:
    st.error("⚠️ Close approach detected")
    for alert in alerts:
        st.write(
            f"{alert['sat1']} & {alert['sat2']} — distance: {alert['distance']:.2f}"
        )

ax.legend()
st.pyplot(fig)
