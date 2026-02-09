import numpy as np


class Satellite:
    def __init__(self, name, radius, angular_velocity, phase=0.0):
        self.name = name
        self.r = radius
        self.w = angular_velocity
        self.phase = phase

    def position(self, t):
        x = self.r * np.cos(self.w * t + self.phase)
        y = self.r * np.sin(self.w * t + self.phase)
        return np.array([x, y])


def distance(p1, p2):
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
