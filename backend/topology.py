import json
import re
from plotly import graph_objects as go
from plotly.utils import PlotlyJSONEncoder

def generate_grid_graph(bus_system: str, ratio=0.75, v_array=None, p_array=None, q_array=None, r_array=None, x_array=None, unused_lines=None, **kwargs):
    """
    Interface function called by main.py to stream custom IEEE grid coordinates dynamically.
    Accepts explicit custom data state arrays to bypass static hardcoded loops.
    """
    if unused_lines is None:
        unused_lines = []
    # Ensure unused_lines elements are thoroughly normalized to string forms for array matching
    unused_lines = [str(x) for x in unused_lines]
    
    # Fallback default values matching the IEEE 33-Bus model structure
    v = v_array if v_array is not None else [1.0] * 33
    p_load = p_array if p_array is not None else [0.0] * 33
    q_load = q_array if q_array is not None else [0.0] * 33
    
    # Impedance configuration profiles (37 line segments)
    r = r_array if r_array is not None else [0.0] * 37
    x = x_array if x_array is not None else [0.0] * 37
    
    return topology(ratio, unused_lines, v, p_load, q_load, r, x)

def topology(ratio=0.75, unused_lines=None, v=None, p_load=None, q_load=None, r=None, x=None):
    if unused_lines is None:
        unused_lines = []
    if v is None:
        v = [1.0] * 33
    if p_load is None:
        p_load = [0.0] * 33
    if q_load is None:
        q_load = [0.0] * 33
    if r is None:
        r = [0.0] * 37
    if x is None:
        x = [0.0] * 37

    # 1. Define Bus Coordinates {Bus_ID: (x, y)}
    bus_coords = {
        'Sub': (0, 10), 1: (0, 9), 2: (0, 8), 3: (0, 7), 4: (0, 6), 5: (0, 5),
        6: (0, 4), 7: (0, 3), 8: (0, 2), 9: (0, 1), 10: (0, 0), 11: (0, -1),
        12: (0, -2), 13: (0, -3), 14: (0, -4), 15: (0, -5), 16: (0, -6),
        17: (0, -7), 18: (0, -8), 19: (-1, 4), 20: (-1, 3), 21: (-1, 2),
        22: (-1, 1), 23: (1, 5), 24: (1, 4), 25: (1, 3), 26: (0.6, 2),
        27: (0.6, 1), 28: (0.6, 0), 29: (0.6, -1), 30: (0.6, -2), 31: (0.6, -3),
        32: (0.6, -4), 33: (0.6, -5),
        # Tie-Line Layout Path Helpers
        2191: (-0.04, 8), 2192: (-0.04, 7.6), 2193: (-1, 7.6),
        3231: (0.04, 7), 3232: (0.04, 6.6), 3233: (1, 6.6),
        6261: (0.04, 4), 6262: (0.04, 3.6), 6263: (0.6, 3.6),
        8211: (-0.04, 2), 8212: (-0.04, 1.6), 8213: (-0.96, 1.6), 8214: (-0.96, 2),
        9151: (0.04, 1), 9152: (0.04, 0.6), 9153: (0.34, 0.6), 9154: (0.34, -5.4), 9155: (0.04, -5.4), 9156: (0.04, -5),
        12221: (-0.04, -2), 12222: (-0.04, -2.4), 12223: (-1, -2.4),
        18331: (0, -8.4), 18332: (0.6, -8.4),
        25291: (1, -1.4), 25292: (0.64, -1.4), 25293: (0.64, -1),
    }

    # 2. Define Lines
    lines = [
        ('Sub', 1, 's'), (1, 2, 's'), (2, 3, 's'), (3, 4, 's'), (4, 5, 's'),
        (5, 6, 's'), (6, 7, 's'), (7, 8, 's'), (8, 9, 's'), (9, 10, 's'),
        (10, 11, 's'), (11, 12, 's'), (12, 13, 's'), (13, 14, 's'), (14, 15, 's'),
        (15, 16, 's'), (16, 17, 's'), (17, 18, 's'), (19, 20, 's'), (20, 21, 's'),
        (21, 22, 's'), (23, 24, 's'), (24, 25, 's'), (26, 27, 's'), (27, 28, 's'),
        (28, 29, 's'), (29, 30, 's'), (30, 31, 's'), (31, 32, 's'), (32, 33, 's'),
        (2191, 2192, 's'), (2192, 2193, 's'), (2193, 19, 's'),
        (3231, 3232, 's'), (3232, 3233, 's'), (3233, 23, 's'),
        (6261, 6262, 's'), (6262, 6263, 's'), (6263, 26, 's'),
        (8211, 8212, 't'), (8212, 8213, 't'), (8213, 8214, 't'),
        (9151, 9152, 't'), (9152, 9153, 't'), (9153, 9154, 't'), (9154, 9155, 't'), (9155, 9156, 't'),
        (12221, 12222, 't'), (12222, 12223, 't'), (12223, 22, 't'),
        (18, 18331, 't'), (18331, 18332, 't'), (18332, 33, 't'),
        (25, 25291, 't'), (25291, 25292, 't'), (25292, 25293, 't'),
    ]

    line_labels = {
        (1, 2): '1', (2, 3): '2', (3, 4): '3', (4, 5): '4', (5, 6): '5',
        (6, 7): '6', (7, 8): '7', (8, 9): '8', (9, 10): '9', (10, 11): '10',
        (11, 12): '11', (12, 13): '12', (13, 14): '13', (14, 15): '14',
        (15, 16): '15', (16, 17): '16', (17, 18): '17', (19, 20): '19',
        (20, 21): '20', (21, 22): '21', (23, 24): '23', (24, 25): '24',
        (26, 27): '26', (27, 28): '27', (28, 29): '28', (29, 30): '29',
        (30, 31): '30', (31, 32): '31', (32, 33): '32',
        (2192, 2193): '18', (3232, 3233): '22', (6262, 6263): '25',
        (8212, 8213): '33', (9153, 9154): '34', (12222, 12223): '35',
        (18331, 18332): '36', (25, 25291): '37'
    }

    undisplayed_labels = {
        (2191, 2192): '18', (2193, 19): '18', (6261, 6262): '25', (6263, 26): '25',
        (3231, 3232): '22', (3233, 23): '22', (8211, 8212): '33', (8213, 8214): '33',
        (9151, 9152): '34', (9152, 9153): '34', (9154, 9155): '34', (9155, 9156): '34',
        (12221, 12222): '35', (12223, 22): '35', (18, 18331): '36', (18332, 33): '36',
        (25291, 25292): '37', (25292, 25293): '37',
    }

    fig = go.Figure()
    assigned_line_colors = {}

    # 3. Add Lines to Figure
    for start_node, end_node, l_type in lines:
        if start_node in bus_coords and end_node in bus_coords:
            x0, y0 = bus_coords[start_node]
            x1, y1 = bus_coords[end_node]
            
            current_line_num = (
                line_labels.get((start_node, end_node)) or line_labels.get((end_node, start_node)) or
                undisplayed_labels.get((start_node, end_node)) or undisplayed_labels.get((end_node, start_node))
            )
            
            if current_line_num in unused_lines:
                color = 'lightgrey'
            else:
                color = 'red' if l_type == 't' else 'black'
                
            if current_line_num:
                assigned_line_colors[current_line_num] = color
                
            dash = '4, 4' if l_type == 't' else 'solid'
            width = 1 if l_type == 't' else 2
            
            fig.add_trace(go.Scatter(
                x=[x0, x1], y=[y0, y1],
                mode='lines',
                line=dict(color=color, width=width * ratio, dash=dash),
                hoverinfo='none',
                showlegend=False
            ))

    # 3b. Add Line Number Labels (With Ohm Ω metric tags)
    for (start_node, end_node), label in line_labels.items():
        if start_node in bus_coords and end_node in bus_coords:
            x0, y0 = bus_coords[start_node]
            x1, y1 = bus_coords[end_node]
            
            if x0 == x1:
                mid_x = x0 + 0.105
                mid_y = (y0 + y1) / 2 - 0.1
            else:
                mid_y = y0 + 0.3
                mid_x = (x0 + x1) / 2
                
            actual_line_color = assigned_line_colors.get(label, 'black')
            text_color = 'blue' if actual_line_color == 'black' else actual_line_color
            
            hover_color = {"red": "white", "blue": "white", "lightgrey": "black", "black": "white"}
            
            idx = int(label) - 1
            r_val = r[idx] if idx < len(r) else 0.0
            x_val = x[idx] if idx < len(x) else 0.0
            
            fig.add_trace(go.Scatter(
                x=[mid_x], y=[mid_y],
                mode='text',
                text=[label],
                textposition="middle center",
                textfont=dict(size=12 * ratio, color=text_color, family="Courier New", weight="bold"),
                hoverinfo='text',
                hovertext=[f"Line {label}<br>Resistance: {r_val} Ω<br>Reactance: {x_val} Ω"],
                hoverlabel=dict(
                    bgcolor=text_color,
                    font=dict(family="Courier New", color=hover_color.get(text_color, "white"), weight="bold")
                ),
                showlegend=False
            ))

    # 4. Add Buses
    real_buses = [k for k in bus_coords.keys() if k != 'Sub' and isinstance(k, int) and k < 100]
    bus_x = [bus_coords[k][0] for k in real_buses]
    bus_y = [bus_coords[k][1] for k in real_buses]
    bus_text = [str(k) for k in real_buses]

    # TRACE A: Busbar dash markers
    fig.add_trace(go.Scatter(
        x=bus_x, y=bus_y,
        mode='markers',
        marker=dict(symbol='line-ew', size=30 * ratio, line=dict(width=4 * ratio, color='black')),
        hoverinfo='none',
        showlegend=False
    ))

    # TRACE B: Text labels inside hollow circles (With metrics tags)
    text_x_shifted = [x_val + 0.105 for x_val in bus_x]
    hover_texts = []
    for k in real_buses:
        idx = k - 1
        v_val = v[idx] if idx < len(v) else 0.0
        p_val = p_load[idx] if idx < len(p_load) else 0.0
        q_val = q_load[idx] if idx < len(q_load) else 0.0
        hover_texts.append(f"Bus: {k}<br>Voltage: {v_val} kV<br>Active Load: {p_val} kW<br>Reactive Load: {q_val} kVAR")

    fig.add_trace(go.Scatter(
        x=text_x_shifted, y=bus_y,
        mode='markers+text',
        text=bus_text,
        textposition="middle center",
        textfont=dict(size=16 * ratio, color='black', family="Courier New", weight="bold"),
        marker=dict(symbol='circle', size=25 * ratio, color='white', line=dict(width=1.5 * ratio, color='black')),
        hoverinfo='text',
        hovertext=hover_texts,
        hoverlabel=dict(font=dict(family="Courier New", weight="bold")),
        showlegend=False
    ))

    # 5. Add Substation
    fig.add_trace(go.Scatter(
        x=[bus_coords['Sub'][0]], y=[10.5],
        mode='text',
        text="Substation",
        textposition="top center",
        textfont=dict(size=18 * ratio, color='black', family="Merriweather Sans"),
        hoverinfo='none',
        showlegend=False
    ))

    # 6. Static Substation Geometry Shape Layout
    layout_shapes = [
        dict(type="rect", x0=-0.1, x1=0.1, y0=9.8, y1=10.2, line=dict(color="black", width=4 * ratio), fillcolor="white", xref="x", yref="y")
    ]

    # --- VECTOR SVG PATH ENGINE ---
    arrow_length = 0.4
    head_size = 0.08
    sw = 0.005
    hw = 0.0125
    arrow_definitions = [
        (0.04, 7.6), (-0.04, 6.6), (-0.04, 5.6), (-0.04, 4.6), (-0.04, 3.6), (-0.04, 2.6),
        (0.04, 1.6), (-0.04, 0.6), (-0.04, -0.4), (-0.04, -1.4), (0.04, -2.4), (-0.04, -3.4),
        (-0.04, -4.4), (-0.04, -5.4), (-0.04, -6.4), (-0.04, -7.4), (-0.04, -8.4),
        (-1.04, 3.6), (-1.04, 2.6), (-1.04, 1.6), (-1.04, 0.6),
        (0.96, 4.6), (0.96, 3.6), (0.96, 2.6),
        (0.56, 1.6), (0.56, 0.6), (0.56, -0.4), (0.56, -1.4), (0.56, -2.4), (0.56, -3.4), (0.56, -4.4), (0.56, -5.4)
    ]
    
    for ax, ay in arrow_definitions:
        tail_y = ay + arrow_length
        arrow_path = (
            f"M {ax - sw} {tail_y} "
            f"L {ax + sw} {tail_y} "
            f"L {ax + sw} {ay + head_size} "
            f"L {ax + hw} {ay + head_size} "
            f"L {ax} {ay} "
            f"L {ax - hw} {ay + head_size} "
            f"L {ax - sw} {ay + head_size} "
            f"Z"
        )
        layout_shapes.append(dict(
            type="path", path=arrow_path, line=dict(width=0), fillcolor="black", xref="x", yref="y"
        ))
        
    fig.update_layout(shapes=layout_shapes)

    # --- DUMMY INTERACTIVE LEGEND LAYER ---
    legend_categories = [
        {"name": "Main Spine (Closed)", "color": "black", "dash": "solid"},
        {"name": "Tie-Lines (Closed)", "color": "red", "dash": "dash"},
        {"name": "Open / Isolated Lines", "color": "lightgrey", "dash": "solid"},
        {"name": "Bus Interconnections", "color": "black", "symbol": "line-ew"},
        {"name": "Substation Supply Bus", "color": "black", "symbol": "square"},
        {"name": "Bus Number", "color": "#1e40af", "symbol": "circle"}
    ]

    for item in legend_categories:
        if "symbol" in item:
            marker_opts = dict(
                symbol=item["symbol"],
                size=14 if item["symbol"] == "line-ew" else 10,
                color=item["color"],
                line=dict(width=2, color=item["color"])
            )
            # Apply layout variables for the custom hollow network bus node
            if item["name"] == "Bus Number":
                marker_opts["color"] = "white"
                marker_opts["line"] = dict(width=2, color="#1e40af")
                marker_opts["size"] = 11

            fig.add_trace(go.Scatter(
                x=[None], y=[None],
                mode="markers",
                name=item["name"],
                marker=marker_opts,
                showlegend=True
            ))
        else:
            fig.add_trace(go.Scatter(
                x=[None], y=[None],
                mode="lines",
                name=item["name"],
                line=dict(color=item["color"], width=2, dash="dash" if item["dash"] == "dash" else "solid"),
                showlegend=True
            ))

    fig.update_layout(
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.08,
            xanchor="center",
            x=0.5,
            itemclick=False,
            itemdoubleclick=False,
            font=dict(family="Courier New", size=11, color="black")
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        xaxis=dict(showgrid=False, zeroline=False, visible=False, fixedrange=False, range=[-2.0, 2.0]),
        yaxis=dict(showgrid=False, zeroline=False, visible=False, fixedrange=False, range=[-10, 12]),
        autosize=True,
        margin=dict(l=0, r=0, t=10, b=40)
    )

    return json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))

def parse_grid_command(user_input: str):
    """
    Enhanced macro parser helper for main UI chat routing.
    Matches scalar manipulations: v*100 [29]
    Matches isolation directives: isolate 33,34,35 or isolate [33, 34, 35]
    """
    cleaned_input = user_input.strip().lower()
    
    # 1. Check for isolate command syntax
    if cleaned_input.startswith("isolate"):
        bus_body = cleaned_input.replace("isolate", "").replace("[", "").replace("]", "").strip()
        buses = [int(b) for b in re.findall(r'\d+', bus_body)]
        if buses:
            return "isolate", "none", 0.0, buses
        return None
        
    # 2. Standard metric modification fallback layout parser
    pattern = r"([vpq])\s*([\+\-\*\/])\s*([0-9\.]+)\s*\[([0-9\s,]+)\]"
    match = re.search(pattern, cleaned_input)
    
    if not match:
        return None
        
    metric = match.group(1)
    operator = match.group(2)
    val = float(match.group(3))
    buses = [int(b) for b in re.findall(r'\d+', match.group(4))]
    return metric, operator, val, buses

if __name__ == "__main__":
    pass