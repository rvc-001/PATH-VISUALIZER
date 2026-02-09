import numpy as np

class Satellite:
    def __init__(self, name, radius, angular_velocity, inclination=0.0, phase=0.0):
        self.name = name
        self.r = radius
        self.w = angular_velocity
        # Convert degrees to radians for calculation
        self.inc = np.radians(inclination)
        self.phase = phase

    def position(self, t):
        # Calculate angle in the orbital plane
        theta = self.w * t + self.phase
        
        # 1. Position in a flat 2D plane (un-tilted)
        x_flat = self.r * np.cos(theta)
        y_flat = self.r * np.sin(theta)
        
        # 2. Rotate the plane by the inclination angle (around the X-axis)
        # x remains x_flat
        # y becomes y_flat * cos(inc)
        # z becomes y_flat * sin(inc)
        x = x_flat
        y = y_flat * np.cos(self.inc)
        z = y_flat * np.sin(self.inc)
        
        return np.array([x, y, z])


def distance(p1, p2):
    # Calculates Euclidean distance in 3D space
    return np.linalg.norm(p1 - p2)


def check_close_approaches(satellites, t, threshold):
    alerts = []
    for i in range(len(satellites)):
        for j in range(i + 1, len(satellites)):
            p1 = satellites[i].position(t)
            p2 = satellites[j].position(t)
            d = distance(p1, p2)

            if d < threshold:
                alerts.append({
                    "sat1": satellites[i].name,
                    "sat2": satellites[j].name,
                    "distance": d
                })

    return alerts