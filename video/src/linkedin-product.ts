import { buildGh } from './gh';
import { jobs, at } from './kit';
declare const Footlit: {play(o:Record<string,unknown>):Promise<void>;stop():void;themes:{id:string}[]};
const w = window as unknown as {__ready:boolean;__start:()=>void};
const film = document.getElementById('film')!;
const gh = buildGh();
film.innerHTML = `<div style="position:absolute;inset:0;background:#0d1117;color:#e6edf3;font:24px system-ui;padding:40px"><div style="border-bottom:1px solid #30363d;padding-bottom:30px">demo / your-next-release</div><h1 style="font-size:42px;margin-top:45px">Ship something worth celebrating <span style="color:#7d8590">#42</span></h1><div style="margin-top:32px;color:#a5abb4">Conversation &nbsp;&nbsp; Commits &nbsp;&nbsp; Checks ✓</div><div style="position:absolute;left:40px;right:40px;top:330px;height:260px">${gh.hookBoxes()}</div></div>`;
const open=film.querySelector<HTMLElement>('.h-open')!,done=film.querySelector<HTMLElement>('.h-done')!;
done.style.opacity='0';
at(.7,()=>{open.style.opacity='0';done.style.opacity='1'});
at(1,()=>void Footlit.play({theme:'marquee',event:'pr.merged',container:film,subject:'your-next-release #42',detail:'Ship something worth celebrating',scale:.75}));
at(6.5,()=>{Footlit.stop();void Footlit.play({theme:'terminal',event:'ci.passed',container:film,subject:'your-next-release',detail:'All checks passed',scale:.85})});
at(9.75,()=>{Footlit.stop();void Footlit.play({theme:'pixel',event:'release.published',container:film,subject:'your-next-release v1.0',detail:'Ready for the world',scale:.60})});
w.__start=()=>jobs.forEach(j=>j());
async function boot(){for(const theme of ['marquee','terminal','pixel']){void Footlit.play({theme,event:'pr.merged',container:film});await new Promise(r=>setTimeout(r,450));Footlit.stop()}w.__ready=true}
void boot();
