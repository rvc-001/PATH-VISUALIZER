import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from orbit import Satellite, check_close_approaches

satellites = [
    Satellite("Sat-A", 4, 0.8),
    Satellite("Sat-B", 6, 0.6, phase=1.2),
    Satellite("Sat-C", 8, 0.4, phase=2.0),
]

threshold = 0.8
t = 0.0

fig, ax = plt.subplots()
ax.set_aspect("equal")
ax.set_xlim(-10, 10)
ax.set_ylim(-10, 10)

earth = plt.Circle((0, 0), 1, color="blue")
ax.add_patch(earth)

points = [ax.plot([], [], "o")[0] for _ in satellites]


def init():
    for p in points:
        p.set_data([], [])
    return points


def update(frame):
    global t
    t += 0.05

    for i, sat in enumerate(satellites):
        pos = sat.position(t)
        points[i].set_data([pos[0]], [pos[1]])  # FIX HERE

    alerts = check_close_approaches(satellites, t, threshold)
    ax.set_title(
        "⚠️ Close Approach Detected" if alerts else "Orbital Path Visualizer"
    )

    return points


ani = FuncAnimation(
    fig,
    update,
    init_func=init,
    interval=50,
    cache_frame_data=False  # suppress warning cleanly
)

plt.show()
