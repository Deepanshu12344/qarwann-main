"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CloudShaderProps = {
  className?: string;
  children?: ReactNode;
  speed?: number;
  count?: number;
  cloudColor?: string;
  skyTopColor?: string;
  skyBottomColor?: string;
};

const VERT = `attribute vec2 a_pos; varying vec2 v_uv; void main(){ v_uv=a_pos*.5+.5; gl_Position=vec4(a_pos,0.,1.); }`;
const FRAG = `
precision highp float;
varying vec2 v_uv; uniform vec2 u_res; uniform float u_time,u_count; uniform vec3 u_cloud,u_skyTop,u_skyBottom;
const mat2 R=mat2(.80,.60,-.60,.80);
float hash(vec2 p){return fract(sin(dot(p,vec2(41.31,289.17)))*26737.367);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*vnoise(p);p=R*p*2.03+19.19;a*=.5;}return s;}
float billow(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*(1.-abs(2.*vnoise(p)-1.));p=R*p*2.11+13.37;a*=.5;}return s;}
float density(vec2 p,vec2 c,vec2 r,float seed,float t){vec2 q=p-c;float ry=q.y>0.?r.y:r.y*.42;float e=1.-length(vec2(q.x/r.x,q.y/ry));if(e<-.35)return 0.;vec2 d=q*(2.4/r.x)+seed;d+=.6*vec2(fbm(d*1.4+t*.04),fbm(d*1.4+7.7-t*.03));return e+(billow(d*1.6)-.62)*.62;}
vec3 cloud(vec3 color,vec3 sky,vec2 p,vec2 c,vec2 r,float seed,float t,float dist){float d=density(p,c,r,seed,t);if(d<.02)return color;float du=density(p+vec2(0.,r.y*.55),c,r,seed,t),o=clamp((du-d)*1.1+d*.55,0.,1.);vec3 cc=mix(u_cloud*1.04,mix(u_cloud*.60,sky,.38),o*.85);float a=smoothstep(.02,.38,d),rim=smoothstep(.02,.14,d)*(1.-smoothstep(.14,.40,d));cc+=rim*.10;cc=mix(cc,sky,dist*.35);return mix(color,cc,a*mix(1.,.8,dist));}
vec3 pass(vec3 color,vec3 sky,vec2 p,float aspect,float t,float sp,float phase,float y,vec2 r,float seed,float dist){float x=mix(-r.x-.25,aspect+r.x+.25,fract(t*sp+phase));return cloud(color,sky,p,vec2(x,y+sin(t*.05+phase*6.2831)*.012),r,seed,t,dist);}
void main(){float a=u_res.x/u_res.y,t=u_time;vec2 p=vec2(v_uv.x*a,v_uv.y);vec3 sky=mix(u_skyBottom,u_skyTop,v_uv.y),color=mix(sky,u_skyBottom*1.06,smoothstep(.35,0.,v_uv.y)*.5);vec2 sun=vec2(a*.78,.92);color+=vec3(1.,.95,.82)*exp(-dot(p-sun,p-sun)*5.)*.28;float band=smoothstep(.55,.8,v_uv.y)*(1.-smoothstep(.9,1.,v_uv.y));color=mix(color,u_cloud*.98,smoothstep(.52,.78,fbm(vec2(p.x*1.6-t*.006,p.y*12.)))*band*.35);if(u_count>5.5)color=pass(color,sky,p,a,t,.006,.10,.84,vec2(.20,.10),43.7,1.);if(u_count>4.5)color=pass(color,sky,p,a,t,.008,.62,.73,vec2(.24,.12),71.3,.85);if(u_count>3.5)color=pass(color,sky,p,a,t,.011,.33,.60,vec2(.34,.16),17.3,.55);if(u_count>2.5)color=pass(color,sky,p,a,t,.013,.80,.47,vec2(.30,.15),29.9,.45);if(u_count>1.5)color=pass(color,sky,p,a,t,.016,.05,.35,vec2(.46,.20),91.1,.15);gl_FragColor=vec4(pass(color,sky,p,a,t,.020,.48,.20,vec2(.56,.24),57.2,0.),1.);}`;

function color(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(hex)) return [0, 1, 2].map((i) => parseInt(hex[i] + hex[i], 16) / 255) as [number, number, number];
  if (/^[0-9a-f]{6}$/i.test(hex)) return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const rgb = value.match(/[\d.]+/g);
  return rgb?.length && rgb.length >= 3 ? [Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255] : [.95, .95, .95];
}
function compile(gl: WebGLRenderingContext, type: number, source: string) { const shader = gl.createShader(type); if (!shader) return null; gl.shaderSource(shader, source); gl.compileShader(shader); return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null; }

export function CloudShader({ className, children, speed = 1, count = 6, cloudColor = "#fbf8f2", skyTopColor = "#3876ba", skyBottomColor = "#8cbfe8" }: CloudShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const params = useRef({ speed, count, cloudColor, skyTopColor, skyBottomColor });
  params.current = { speed, count, cloudColor, skyTopColor, skyBottomColor };
  useEffect(() => { const canvas = canvasRef.current; const gl = canvas?.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false }); if (!canvas || !gl) return; const vert = compile(gl, gl.VERTEX_SHADER, VERT), frag = compile(gl, gl.FRAGMENT_SHADER, FRAG), program = gl.createProgram(); if (!vert || !frag || !program) return; gl.attachShader(program, vert); gl.attachShader(program, frag); gl.bindAttribLocation(program, 0, "a_pos"); gl.linkProgram(program); if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return; gl.useProgram(program); const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0); const loc = ["u_res","u_time","u_count","u_cloud","u_skyTop","u_skyBottom"].map((name) => gl.getUniformLocation(program, name)); const resize = () => { const w = Math.max(1, Math.floor(canvas.clientWidth * Math.min(devicePixelRatio || 1, 2))), h = Math.max(1, Math.floor(canvas.clientHeight * Math.min(devicePixelRatio || 1, 2))); if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; } gl.viewport(0,0,w,h); gl.uniform2f(loc[0],w,h); }; const observer = new ResizeObserver(resize); observer.observe(canvas); resize(); const start = performance.now(), reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; let frame = 0, active = true; const draw = (now: number) => { if (!active) return; const p = params.current, cloud = color(p.cloudColor), top = color(p.skyTopColor), bottom = color(p.skyBottomColor); gl.uniform1f(loc[1], reduced ? 0 : (now-start)/1000*p.speed); gl.uniform1f(loc[2], Math.min(6,Math.max(1,p.count))); gl.uniform3f(loc[3],...cloud); gl.uniform3f(loc[4],...top); gl.uniform3f(loc[5],...bottom); gl.drawArrays(gl.TRIANGLES,0,3); frame=requestAnimationFrame(draw); }; frame=requestAnimationFrame(draw); return () => { active=false; cancelAnimationFrame(frame); observer.disconnect(); gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.deleteShader(vert); gl.deleteShader(frag); }; }, []);
  return <div className={cn("relative h-full min-h-80 w-full overflow-hidden", className)}><canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />{children ? <div className="relative z-10 flex h-full w-full items-center justify-center">{children}</div> : null}</div>;
}
