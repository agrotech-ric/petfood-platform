"""
Digestion kinetics calculator using Michaelis-Menten equations.
Simulates protein, fat, and carbohydrate digestion over 6 hours.
"""

from typing import List, Tuple
from app.models import DigestionPoint, DigestionForecastPoint, DigestionData
import numpy as np
from scipy.optimize import brentq


def simulate_mm(S0, Vmax, Km, T=6, dt=0.01):
    S = S0
    time = 0
    times = [0]
    remaining = [S0]
    absorbed = [0]
    while time < T:
        v = Vmax * S / (Km + S)
        dS = min(v * dt, S)
        S -= dS
        time += dt
        times.append(time)
        remaining.append(S)
        absorbed.append(S0 - S)
    return np.array(times), np.array(remaining), np.array(absorbed)

def simulate_fat(L0, ke, Vmax, Km, T=6, dt=0.01):
    L = L0
    E = 0.0
    time = 0.0
    times = [0.0]
    remaining = [L]
    intermediate = [E]
    absorbed = [0.0]
    while time < T:
        dEdt = ke * (L - E)
        if E <= 1e-9:
            rate = 0.0
        else:
            rate = Vmax * E / (Km + E)
        dLdt = -rate
        E = E + dEdt * dt
        if E < 0:
            E = 0
        if E > L:
            E = L
        L = L + dLdt * dt
        if L < 0:
            L = 0
        time += dt
        times.append(time)
        remaining.append(L)
        intermediate.append(E)
        absorbed.append(L0 - L)

    return (
        np.array(times),
        np.array(remaining),
        np.array(intermediate),
        np.array(absorbed))

def simulate_carbs(S0, k1, k2, T=6, dt=0.01):
    S = S0
    M = 0.0
    G = 0.0
    time = 0.0
    times = [0.0]
    remaining = [S]
    intermediate = [M]
    absorbed = [G]

    while time < T:
        dSdt = -k1 * S
        dMdt = k1 * S - k2 * M
        dGdt = k2 * M
        S = S + dSdt * dt
        M = M + dMdt * dt
        G = G + dGdt * dt

        if S < 0:
            S = 0
        if M < 0:
            M = 0
        if G < 0:
            G = 0
        time += dt
        times.append(time)
        remaining.append(S)
        intermediate.append(M)
        absorbed.append(G)

    return (
        np.array(times),
        np.array(remaining),
        np.array(intermediate),
        np.array(absorbed)
    )

class DigestionSimulator:
    T = 6
    OUTPUT_DT = 1.0
    
    @staticmethod
    def simulate_protein(protein_grams: float) -> Tuple[List[DigestionPoint], float, List[DigestionForecastPoint]]:

        if protein_grams <= 0:
            return [], 0.0, []       
             
        Km_values = np.linspace(0.1, 50, 300)
        Vmax_values = []

        S0 = protein_grams
        target_absorbed = 0.916 * S0  

        for Km in Km_values:
            def objective(Vmax):
                times_local, remaining, absorbed = simulate_mm(S0, Vmax, Km, DigestionSimulator.T)
                return absorbed[-1] - target_absorbed
            try:
                Vmax = brentq(objective, 0.001, 100)
                Vmax_values.append(Vmax)
            except ValueError:
                Vmax_values.append(0.5)

        Vmax_values = np.array(Vmax_values)
        all_curves = []
        for Km, Vmax in zip(Km_values, Vmax_values):
            times_local, remaining, absorbed = simulate_mm(S0, Vmax, Km, DigestionSimulator.T)
            remaining_1 = S0 - absorbed
            all_curves.append(remaining_1)
        all_curves = np.array(all_curves)
        mean = np.mean(all_curves, axis=0)
        
        points: List[DigestionPoint] = []
        output_times = np.arange(0, DigestionSimulator.T + 1, DigestionSimulator.OUTPUT_DT)
        mean_remaining_by_output = np.interp(output_times, times_local, mean)
        for t, s in zip(output_times, mean_remaining_by_output):
            points.append(DigestionPoint(time=round(float(t), 2), remaining=round(float(s), 2)))
        
        final_remaining = mean[-1]
        absorbed_grams = S0 - final_remaining
        absorption = (absorbed_grams / S0 * 100 if S0 > 0 else 0)
        absorption = max(0, min(100, absorption))

        forecast: List[DigestionForecastPoint] = []
        hour_times = np.arange(1, 7)
        mean_remaining_by_hour = np.interp(hour_times, times_local, mean)

        for hour, remaining_at_hour in zip(range(1, 7), mean_remaining_by_hour):
            absorbed_grams = S0 - remaining_at_hour
            absorbed_percent = (absorbed_grams / S0 * 100 if S0 > 0 else 0)
            forecast.append(DigestionForecastPoint(hour=hour,
                                                    percent=round(min(100, absorbed_percent), 1),
                                                    grams=round(absorbed_grams, 2)))
        
        return points, round(absorption, 2), forecast
    
    @staticmethod
    def simulate_fat(fat_grams: float) -> Tuple[List[DigestionPoint], float, List[DigestionForecastPoint]]:
        
        if fat_grams <= 0:
            return [], 0.0, []
        
        L0 = fat_grams
        TARGET = 0.968
        target_absorbed = TARGET * L0
        ke = 1.0
        Km_values_fat = np.linspace(0.01, 50, 300)
        Vmax_values_fat = []

        for Km in Km_values_fat:
            def objective(Vmax):
                times_local, remaining, E, absorbed = simulate_fat(L0, ke, Vmax, Km, DigestionSimulator.T)
                return absorbed[-1] - target_absorbed
            try:
                Vmax = brentq(objective, 0.001, 100)
                Vmax_values_fat.append(Vmax)
            except ValueError:
                Vmax_values_fat.append(0.5)

        Vmax_values_fat = np.array(Vmax_values_fat)

        all_curves_fat = []
        for Km, Vmax in zip(Km_values_fat, Vmax_values_fat):
            times_local, remaining, E, absorbed = simulate_fat(L0, ke, Vmax, Km, DigestionSimulator.T)
            remaining_1 = L0 - absorbed
            all_curves_fat.append(remaining_1)
        all_curves_fat = np.array(all_curves_fat)
        mean_fat = np.mean(all_curves_fat, axis=0)

        points: List[DigestionPoint] = []
        output_times = np.arange(0, DigestionSimulator.T + 1, DigestionSimulator.OUTPUT_DT)
        mean_remaining_by_output = np.interp(output_times, times_local, mean_fat)

        for t, remaining_grams in zip(output_times, mean_remaining_by_output):
            points.append(DigestionPoint(time=round(float(t), 2), remaining=round(float(remaining_grams), 2)))

        final_remaining = mean_fat[-1]
        final_absorbed = L0 - final_remaining
        absorption = (final_absorbed / L0 * 100 if L0 > 0 else 0)
        absorption = max(0, min(100, absorption))

        forecast: List[DigestionForecastPoint] = []
        hour_times = np.arange(1, 7)
        mean_remaining_by_hour = np.interp(hour_times, times_local, mean_fat)

        for hour, remaining_grams in zip(range(1, 7), mean_remaining_by_hour):
            absorbed_grams = L0 - remaining_grams
            absorbed_percent = (absorbed_grams / L0 * 100 if L0 > 0 else 0)
            forecast.append(DigestionForecastPoint(hour=hour, 
                                                     percent=round(min(100, absorbed_percent), 1),
                                                     grams=round(float(absorbed_grams), 2)))
        return points, round(absorption, 2), forecast

    
    @staticmethod
    def simulate_carbs(carbs_grams: float) -> Tuple[List[DigestionPoint], float, List[DigestionForecastPoint]]:
        
        if carbs_grams <= 0:
            return [], 0.0, []
                
        S0 = carbs_grams
        TARGET = 0.895
        target_absorbed = TARGET * S0
        k1_values = np.linspace(0.001, 5, 300)
        k2_values = []
        valid_k1_values = []
        for k1 in k1_values:
            def objective(k2):
                times_local, S, M, G = simulate_carbs(S0, k1, k2, DigestionSimulator.T)
                return G[-1] - target_absorbed
            f_low = objective(0.001)
            f_high = objective(20)
            if f_low * f_high < 0:
                try:
                    k2 = brentq(objective, 0.001, 20)
                    valid_k1_values.append(k1)
                    k2_values.append(k2)
                except ValueError:
                    pass

        k1_values = np.array(valid_k1_values)
        k2_values = np.array(k2_values)

        if len(k1_values) == 0:
            k1_values = np.array([1.0])
            k2_values = np.array([2.0])

        all_curves_carb = []
        for k1, k2 in zip(k1_values, k2_values):
            times_local, S, M, G = simulate_carbs(S0, k1, k2, DigestionSimulator.T)
            remaining_1 = S0 - G
            all_curves_carb.append(remaining_1)
        all_curves_carb = np.array(all_curves_carb)
        mean_carb = np.mean(all_curves_carb, axis=0)

        points: List[DigestionPoint] = []
        output_times = np.arange(0, DigestionSimulator.T + 1, DigestionSimulator.OUTPUT_DT)
        mean_remaining_by_output = np.interp(output_times, times_local, mean_carb)

        for t, remaining_grams in zip(output_times, mean_remaining_by_output):
            points.append(DigestionPoint(time=round(float(t), 2), remaining=round(float(remaining_grams), 2)))

        final_remaining = mean_carb[-1]
        final_absorbed = S0 - final_remaining
        absorption = (final_absorbed / S0 * 100 if S0 > 0 else 0)
        absorption = max(0, min(100, absorption))


        forecast: List[DigestionForecastPoint] = []
        hour_times = np.arange(1, 7)
        mean_remaining_by_hour = np.interp(hour_times,times_local,mean_carb)

        for hour, remaining_grams in zip(range(1, 7), mean_remaining_by_hour):
            absorbed_grams = S0 - remaining_grams
            absorbed_percent = (absorbed_grams / S0 * 100 if S0 > 0 else 0)

            forecast.append( DigestionForecastPoint( hour=hour,
                                        percent=round(min(100, absorbed_percent), 1),
                                        grams=round(float(absorbed_grams), 2) ))

        return points, round(absorption, 2), forecast

    
    @staticmethod
    def calculate_digestion(
        protein_grams: float,
        fat_grams: float,
        carbs_grams: float
    ) -> DigestionData:
        """Calculate complete digestion data for all macronutrients."""
        
        protein_curve, protein_absorption, protein_forecast = DigestionSimulator.simulate_protein(protein_grams)
        fat_curve, fat_absorption, fat_forecast = DigestionSimulator.simulate_fat(fat_grams)
        carbs_curve, carbs_absorption, carbs_forecast = DigestionSimulator.simulate_carbs(carbs_grams)
        
        return DigestionData(
            protein=protein_curve,
            fat=fat_curve,
            carbs=carbs_curve,
            proteinAbsorption=protein_absorption,
            fatAbsorption=fat_absorption,
            carbsAbsorption=carbs_absorption,
            proteinForecast=protein_forecast,
            fatForecast=fat_forecast,
            carbsForecast=carbs_forecast
        )
