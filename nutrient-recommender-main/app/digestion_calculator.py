"""
Digestion kinetics calculator using Michaelis-Menten equations.
Simulates protein, fat, and carbohydrate digestion over 6 hours.
"""

from typing import List, Tuple
from app.models import DigestionPoint, DigestionForecastPoint, DigestionData


class DigestionSimulator:
    """Simulates macronutrient digestion using kinetic models."""
    
    # Michaelis-Menten parameters for protein
    PROTEIN_VMAX = 0.50
    PROTEIN_KM = 0.20
    
    # Two-phase kinetic parameters for fat
    FAT_KE = 1.0
    FAT_VMAX = 0.50
    FAT_KM = 0.20
    
    # Two-compartment model parameters for carbs
    CARB_K1 = 1.0
    CARB_K2 = 2.0
    
    # Simulation parameters
    INTERNAL_DT = 0.01  # Internal time step (hours)
    OUTPUT_DT = 1.0     # Output time step (hours)
    TMAX = 6.0          # Maximum simulation time (hours)
    
    @staticmethod
    def simulate_protein(protein_grams: float) -> Tuple[List[DigestionPoint], float, List[DigestionForecastPoint]]:
        """
        Simulate protein digestion using Michaelis-Menten kinetics.
        
        dS/dt = -Vmax * S / (Km + S)
        where S = amount remaining, Vmax = max velocity, Km = Michaelis constant
        """
        if protein_grams <= 0:
            return [], 0.0, []
        
        s0 = protein_grams
        vmax = DigestionSimulator.PROTEIN_VMAX * s0
        km = DigestionSimulator.PROTEIN_KM * s0
        
        points: List[DigestionPoint] = []
        forecast: List[DigestionForecastPoint] = []
        
        steps = int(round(DigestionSimulator.TMAX / DigestionSimulator.INTERNAL_DT))
        output_stride = int(round(DigestionSimulator.OUTPUT_DT / DigestionSimulator.INTERNAL_DT))
        
        s = s0
        t = 0.0
        absorption = 0.0
        
        points.append(DigestionPoint(time=0.0, remaining=s0))
        
        for i in range(1, steps + 1):
            ds_dt = -vmax * s / (km + s)
            s = s + ds_dt * DigestionSimulator.INTERNAL_DT
            if s < 0:
                s = 0
            
            t = i * DigestionSimulator.INTERNAL_DT
            if t > DigestionSimulator.TMAX:
                t = DigestionSimulator.TMAX
            
            if i % output_stride == 0 or i == steps:
                absorbed = (s0 - s) / s0 if s0 > 0 else 0
                absorption = max(0, min(100, absorbed * 100))
                points.append(DigestionPoint(time=round(t, 2), remaining=round(s, 2)))
        
        # Calculate forecast at hourly intervals
        s = s0
        for hour in range(1, 7):
            hour_steps = int(round(hour / DigestionSimulator.INTERNAL_DT))
            for _ in range(hour_steps):
                ds_dt = -vmax * s / (km + s)
                s = s + ds_dt * DigestionSimulator.INTERNAL_DT
                if s < 0:
                    s = 0
            
            absorbed_grams = s0 - s
            absorbed_percent = (absorbed_grams / s0 * 100) if s0 > 0 else 0
            forecast.append(DigestionForecastPoint(
                hour=hour,
                percent=round(min(100, absorbed_percent), 1),
                grams=round(absorbed_grams, 2)
            ))
        
        return points, round(absorption, 2), forecast
    
    @staticmethod
    def simulate_fat(fat_grams: float) -> Tuple[List[DigestionPoint], float, List[DigestionForecastPoint]]:
        """
        Simulate fat digestion with two-phase kinetics.
        
        Phase 1: Emulsification (dE/dt = Ke * (L - E))
        Phase 2: Absorption (dL/dt = -Vmax * E / (Km + E))
        where L = lipid amount, E = emulsified lipid
        """
        if fat_grams <= 0:
            return [], 0.0, []
        
        l0 = fat_grams
        ke = DigestionSimulator.FAT_KE
        vmax = DigestionSimulator.FAT_VMAX * l0
        km = DigestionSimulator.FAT_KM * l0
        
        points: List[DigestionPoint] = []
        forecast: List[DigestionForecastPoint] = []
        
        steps = int(round(DigestionSimulator.TMAX / DigestionSimulator.INTERNAL_DT))
        output_stride = int(round(DigestionSimulator.OUTPUT_DT / DigestionSimulator.INTERNAL_DT))
        
        l = l0
        e = 0.0
        t = 0.0
        absorption = 0.0
        
        points.append(DigestionPoint(time=0.0, remaining=l0))
        
        for i in range(1, steps + 1):
            de_dt = ke * (l - e)
            rate = vmax * e / (km + e) if e > 1e-9 else 0.0
            dl_dt = -rate
            
            e = e + de_dt * DigestionSimulator.INTERNAL_DT
            if e < 0:
                e = 0
            if e > l:
                e = l
            
            l = l + dl_dt * DigestionSimulator.INTERNAL_DT
            if l < 0:
                l = 0
            
            t = i * DigestionSimulator.INTERNAL_DT
            if t > DigestionSimulator.TMAX:
                t = DigestionSimulator.TMAX
            
            if i % output_stride == 0 or i == steps:
                absorbed = (l0 - l) / l0 if l0 > 0 else 0
                absorption = max(0, min(100, absorbed * 100))
                points.append(DigestionPoint(time=round(t, 2), remaining=round(l, 2)))
        
        # Calculate forecast at hourly intervals
        l = l0
        e = 0.0
        for hour in range(1, 7):
            hour_steps = int(round(hour / DigestionSimulator.INTERNAL_DT))
            for _ in range(hour_steps):
                de_dt = ke * (l - e)
                rate = vmax * e / (km + e) if e > 1e-9 else 0.0
                dl_dt = -rate
                
                e = e + de_dt * DigestionSimulator.INTERNAL_DT
                l = l + dl_dt * DigestionSimulator.INTERNAL_DT
                if e < 0:
                    e = 0
                if l < 0:
                    l = 0
                if e > l:
                    e = l
            
            absorbed_grams = l0 - l
            absorbed_percent = (absorbed_grams / l0 * 100) if l0 > 0 else 0
            forecast.append(DigestionForecastPoint(
                hour=hour,
                percent=round(min(100, absorbed_percent), 1),
                grams=round(absorbed_grams, 2)
            ))
        
        return points, round(absorption, 2), forecast
    
    @staticmethod
    def simulate_carbs(carbs_grams: float) -> Tuple[List[DigestionPoint], float, List[DigestionForecastPoint]]:
        """
        Simulate carbohydrate digestion using two-compartment model.
        
        dS/dt = -K1 * S (Substrate breakdown)
        dM/dt = K1 * S - K2 * M (Monosaccharide formation)
        dG/dt = K2 * M (Glucose absorption)
        """
        if carbs_grams <= 0:
            return [], 0.0, []
        
        s0 = carbs_grams
        k1 = DigestionSimulator.CARB_K1
        k2 = DigestionSimulator.CARB_K2
        
        points: List[DigestionPoint] = []
        forecast: List[DigestionForecastPoint] = []
        
        steps = int(round(DigestionSimulator.TMAX / DigestionSimulator.INTERNAL_DT))
        output_stride = int(round(DigestionSimulator.OUTPUT_DT / DigestionSimulator.INTERNAL_DT))
        
        s = s0
        m = 0.0
        g = 0.0
        t = 0.0
        absorption = 0.0
        
        points.append(DigestionPoint(time=0.0, remaining=s0))
        
        for i in range(1, steps + 1):
            ds_dt = -k1 * s
            dm_dt = k1 * s - k2 * m
            dg_dt = k2 * m
            
            s = s + ds_dt * DigestionSimulator.INTERNAL_DT
            if s < 0:
                s = 0
            
            m = m + dm_dt * DigestionSimulator.INTERNAL_DT
            if m < 0:
                m = 0
            
            g = g + dg_dt * DigestionSimulator.INTERNAL_DT
            if g < 0:
                g = 0
            
            t = i * DigestionSimulator.INTERNAL_DT
            if t > DigestionSimulator.TMAX:
                t = DigestionSimulator.TMAX
            
            if i % output_stride == 0 or i == steps:
                absorbed = g / s0 if s0 > 0 else 0
                absorption = max(0, min(100, absorbed * 100))
                points.append(DigestionPoint(time=round(t, 2), remaining=round(s0 - g, 2)))
        
        # Calculate forecast at hourly intervals
        s = s0
        m = 0.0
        g = 0.0
        for hour in range(1, 7):
            hour_steps = int(round(hour / DigestionSimulator.INTERNAL_DT))
            for _ in range(hour_steps):
                ds_dt = -k1 * s
                dm_dt = k1 * s - k2 * m
                dg_dt = k2 * m
                
                s = s + ds_dt * DigestionSimulator.INTERNAL_DT
                m = m + dm_dt * DigestionSimulator.INTERNAL_DT
                g = g + dg_dt * DigestionSimulator.INTERNAL_DT
                if s < 0:
                    s = 0
                if m < 0:
                    m = 0
                if g < 0:
                    g = 0
            
            absorbed_grams = g
            absorbed_percent = (absorbed_grams / s0 * 100) if s0 > 0 else 0
            forecast.append(DigestionForecastPoint(
                hour=hour,
                percent=round(min(100, absorbed_percent), 1),
                grams=round(absorbed_grams, 2)
            ))
        
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
