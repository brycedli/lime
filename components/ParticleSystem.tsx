"use client";

import { useEffect, useRef } from 'react';

interface ParticleSystemProps {
  color1?: [number, number, number];
  color2?: [number, number, number];
  color3?: [number, number, number];
  color4?: [number, number, number];
  speed?: number;
}

export default function ParticleSystem({ 
  color1 = [0.2, 0.1, 0.4],
  color2 = [0.8, 0.3, 0.6], 
  color3 = [0.1, 0.4, 0.8],
  color4 = [0.9, 0.5, 0.2],
  speed = 3.0
}: ParticleSystemProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Vertex shader source - simple fullscreen quad
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
      }
    `;

    // Fragment shader source - adapted from Shadertoy
    const fragmentShaderSource = `
      precision mediump float;
      
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform vec3 u_color4;
      uniform float u_speed;
      
      varying vec2 v_uv;
      
      #define S(a,b,t) smoothstep(a,b,t)
      
      mat2 Rot(float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c);
      }
      
      // Created by inigo quilez - iq/2014
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
        return fract(sin(p) * 43758.5453);
      }
      
      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        float n = mix(
          mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)), 
              dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
          mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), 
              dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
        return 0.5 + 0.5 * n;
      }
      
      // Film grain function
      float filmGrain(vec2 uv, float time) {
        vec2 seed = uv + fract(time);
        return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 fragCoord = gl_FragCoord.xy;
        vec2 iResolution = u_resolution;
        float iTime = u_time * 0.01 * u_speed;
        
        vec2 uv = fragCoord / iResolution.xy;
        float ratio = iResolution.x / iResolution.y;
        
        vec2 tuv = uv;
        tuv -= 0.5;
        
        // rotate with Noise (faster)
        float degree = noise(vec2(iTime * 0.3, tuv.x * tuv.y));
        
        tuv.y *= 1.0 / ratio;
        tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
        tuv.y *= ratio;
        
        // Wave warp with sin (faster)
        float frequency = 8.0;
        float amplitude = 20.0;
        float speed = iTime * 4.0;
        tuv.x += sin(tuv.y * frequency + speed) / amplitude;
        tuv.y += sin(tuv.x * frequency * 1.5 + speed) / (amplitude * 0.5);
        
        // draw the image with dynamic colors
        vec3 layer1 = mix(u_color1, u_color2, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));
        vec3 layer2 = mix(u_color3, u_color4, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));
        
        vec3 finalComp = mix(layer1, layer2, S(0.5, -0.3, tuv.y));
        
        // Add film grain (softer)
        float grain = filmGrain(uv * 1.5, iTime * 5.0);
        grain = (grain - 0.5) * 0.06; // Much more subtle intensity
        
        // Apply grain to final color
        vec3 col = finalComp + grain;
        
        // Add some subtle vignetting for extra retro feel
        float vignette = 1.0 - length(uv - 0.5) * 0.8;
        col *= vignette;
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // Create shader function
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }

    // Create program
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const color1Location = gl.getUniformLocation(program, 'u_color1');
    const color2Location = gl.getUniformLocation(program, 'u_color2');
    const color3Location = gl.getUniformLocation(program, 'u_color3');
    const color4Location = gl.getUniformLocation(program, 'u_color4');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');

    // Create buffer for fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    
    // Fullscreen quad vertices
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Animation loop
    function animate() {
      if (!gl || !program || !buffer) return;

      timeRef.current += 1;

      // Clear canvas
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use program
      gl.useProgram(program);

      // Set uniforms
      gl.uniform1f(timeLocation, timeRef.current);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform3f(color1Location, color1[0], color1[1], color1[2]);
      gl.uniform3f(color2Location, color2[0], color2[1], color2[2]);
      gl.uniform3f(color3Location, color3[0], color3[1], color3[2]);
      gl.uniform3f(color4Location, color4[0], color4[1], color4[2]);
      gl.uniform1f(speedLocation, speed);

      // Bind buffer and set up attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Draw fullscreen quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="absolute inset-0 w-full h-full"
    />
  );
}
