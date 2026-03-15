"use client";

import { useState, useEffect } from "react";
import { Plus, Wrench, RotateCcw, Box, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

type Categoria = "Sonido" | "DJ" | "Infraestructuras" | "Luces y efectos";

interface Producto {
    id: string;
    nombre: string;
    categoria: Categoria;
    unidadesTotales: number;
    unidadesEnReparacion: number;
}

const CATEGORIAS: Categoria[] = ["Sonido", "DJ", "Infraestructuras", "Luces y efectos"];

export default function InventarioPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [isClient, setIsClient] = useState(false);

    // Add form state
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newNombre, setNewNombre] = useState("");
    const [newCategoria, setNewCategoria] = useState<Categoria | "">("");
    const [newUnidades, setNewUnidades] = useState<number | "">("");

    useEffect(() => {
        setIsClient(true);
        const saved = localStorage.getItem("gilcasound_inventario");
        if (saved) {
            try {
                setProductos(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse inventario", e);
            }
        } else {
            // Seed con el inventario real de GilcaSound
            const seed: Producto[] = [
                // DJ (Pioneer standalone)
                { id: "dj1", nombre: "Pioneer XDJ-RX3 (standalone)",     categoria: "DJ", unidadesTotales: 2, unidadesEnReparacion: 0 },
                { id: "dj2", nombre: "Pioneer XDJ-XZ (standalone)",      categoria: "DJ", unidadesTotales: 1, unidadesEnReparacion: 0 },
                { id: "dj3", nombre: "Pioneer DJM-900NXS2",              categoria: "DJ", unidadesTotales: 2, unidadesEnReparacion: 0 },
                { id: "dj4", nombre: "Pioneer CDJ-3000 (par)",           categoria: "DJ", unidadesTotales: 3, unidadesEnReparacion: 0 },
                { id: "dj5", nombre: "Pioneer DDJ-FLX10",                categoria: "DJ", unidadesTotales: 1, unidadesEnReparacion: 1 },
                // Sonido — Maga Engineering
                { id: "s1", nombre: "Maga Engineering SUB 218",          categoria: "Sonido", unidadesTotales: 4, unidadesEnReparacion: 0 },
                { id: "s2", nombre: "Maga Engineering LINE 112",         categoria: "Sonido", unidadesTotales: 8, unidadesEnReparacion: 1 },
                { id: "s3", nombre: "Maga Engineering STAGE 10 (monitor)", categoria: "Sonido", unidadesTotales: 4, unidadesEnReparacion: 0 },
                { id: "s4", nombre: "Procesador DBX DriveRack PA2",      categoria: "Sonido", unidadesTotales: 2, unidadesEnReparacion: 0 },
                { id: "s5", nombre: "Micrófono Shure SM58",              categoria: "Sonido", unidadesTotales: 6, unidadesEnReparacion: 0 },
                // Luces y efectos — Stairville & Varytech
                { id: "l1", nombre: "Stairville MH-x25 Spot (cabeza móvil)",   categoria: "Luces y efectos", unidadesTotales: 8, unidadesEnReparacion: 1 },
                { id: "l2", nombre: "Stairville LED Par 64 RGBA",               categoria: "Luces y efectos", unidadesTotales: 16, unidadesEnReparacion: 0 },
                { id: "l3", nombre: "Stairville SF-100 MkII (máquina humo vertical)", categoria: "Luces y efectos", unidadesTotales: 3, unidadesEnReparacion: 0 },
                { id: "l4", nombre: "Stairville AF-150 (máquina humo vertical DMX)", categoria: "Luces y efectos", unidadesTotales: 2, unidadesEnReparacion: 0 },
                { id: "l5", nombre: "Varytech Beam 230 Sharpy",                 categoria: "Luces y efectos", unidadesTotales: 6, unidadesEnReparacion: 0 },
                { id: "l6", nombre: "Varytech Wash 19x15W RGBWA",               categoria: "Luces y efectos", unidadesTotales: 8, unidadesEnReparacion: 2 },
                { id: "l7", nombre: "Varytech Stroboscopio 1000W DMX",          categoria: "Luces y efectos", unidadesTotales: 4, unidadesEnReparacion: 0 },
                { id: "l8", nombre: "Máquina CO₂ criogénico",                   categoria: "Luces y efectos", unidadesTotales: 2, unidadesEnReparacion: 0 },
                { id: "l9", nombre: "Pantalla LED modular 3×2m",                categoria: "Luces y efectos", unidadesTotales: 1, unidadesEnReparacion: 0 },
                // Infraestructuras — trusses varios metros
                { id: "i1", nombre: "Truss aluminio cuadrado 290mm — 4m",  categoria: "Infraestructuras", unidadesTotales: 8,  unidadesEnReparacion: 0 },
                { id: "i2", nombre: "Truss aluminio cuadrado 290mm — 3m",  categoria: "Infraestructuras", unidadesTotales: 10, unidadesEnReparacion: 0 },
                { id: "i3", nombre: "Truss aluminio cuadrado 290mm — 2m",  categoria: "Infraestructuras", unidadesTotales: 12, unidadesEnReparacion: 0 },
                { id: "i4", nombre: "Truss aluminio cuadrado 290mm — 1m",  categoria: "Infraestructuras", unidadesTotales: 16, unidadesEnReparacion: 0 },
                { id: "i5", nombre: "Truss aluminio cuadrado 290mm — 0.5m", categoria: "Infraestructuras", unidadesTotales: 20, unidadesEnReparacion: 0 },
                { id: "i6", nombre: "Base torre truss con ruedas",          categoria: "Infraestructuras", unidadesTotales: 8,  unidadesEnReparacion: 1 },
                { id: "i7", nombre: "Conector esquinero 90° truss",         categoria: "Infraestructuras", unidadesTotales: 24, unidadesEnReparacion: 0 },
                { id: "i8", nombre: "DJ Booth portátil (blanco)",           categoria: "Infraestructuras", unidadesTotales: 2,  unidadesEnReparacion: 0 },
                { id: "i9", nombre: "DJ Booth portátil (negro)",            categoria: "Infraestructuras", unidadesTotales: 2,  unidadesEnReparacion: 0 },
            ];
            setProductos(seed);
            localStorage.setItem("gilcasound_inventario", JSON.stringify(seed));
        }
    }, []);

    const saveProductos = (newProds: Producto[]) => {
        setProductos(newProds);
        localStorage.setItem("gilcasound_inventario", JSON.stringify(newProds));
    };

    const handleAddProduct = () => {
        if (!newNombre || !newCategoria || !newUnidades) return;

        const nuevo: Producto = {
            id: Math.random().toString(36).substring(7),
            nombre: newNombre,
            categoria: newCategoria as Categoria,
            unidadesTotales: Number(newUnidades),
            unidadesEnReparacion: 0
        };

        const updated = [...productos, nuevo];
        saveProductos(updated);

        // Reset form
        setNewNombre("");
        setNewCategoria("");
        setNewUnidades("");
        setIsAddOpen(false);
    };

    const handleUpdateReparacion = (id: string, deltaUnidades: number) => {
        const updated = productos.map(p => {
            if (p.id === id) {
                const newReparacion = Math.max(0, Math.min(p.unidadesTotales, p.unidadesEnReparacion + deltaUnidades));
                return { ...p, unidadesEnReparacion: newReparacion };
            }
            return p;
        });
        saveProductos(updated);
    };

    // Derived lists
    const cols = CATEGORIAS.map(cat => ({
        titulo: cat,
        items: productos.filter(p => p.categoria === cat && (p.unidadesTotales - p.unidadesEnReparacion) > 0)
    }));

    const repItems = productos.filter(p => p.unidadesEnReparacion > 0);

    if (!isClient) return null;

    return (
        <div className="flex-1 overflow-x-auto bg-background p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
                    <p className="text-muted-foreground mt-1">Gestiona el material disponible y en reparación.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                            <Plus className="h-4 w-4" /> Añadir Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Nuevo Producto</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Nombre</Label>
                                <Input id="name" value={newNombre} onChange={e => setNewNombre(e.target.value)} className="col-span-3" placeholder="Ej: Altavoz JBL VTX" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="cat" className="text-right">Categoría</Label>
                                <Select value={newCategoria} onValueChange={(v) => setNewCategoria(v as Categoria)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="units" className="text-right">Unidades</Label>
                                <Input id="units" type="number" min="1" value={newUnidades} onChange={e => setNewUnidades(Number(e.target.value))} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddProduct} disabled={!newNombre || !newCategoria || !newUnidades}>Guardar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-4 w-full h-[calc(100vh-140px)] pb-4 overflow-x-auto">
                {/* 4 Categorías + 1 Reparación */}
                {cols.map(col => (
                    <InventoryColumn
                        key={col.titulo}
                        title={col.titulo}
                        items={col.items}
                        type="available"
                        onAction={(id, qty) => handleUpdateReparacion(id, qty)}
                    />
                ))}

                {/* Columna de Reparadas */}
                <InventoryColumn
                    title="En reparación"
                    items={repItems}
                    type="repair"
                    onAction={(id, qty) => handleUpdateReparacion(id, -qty)}
                />
            </div>
        </div>
    );
}

// ─── Flip Card Component ──────────────────────────────────────────────────────
function InventoryColumn({
    title,
    items,
    type,
    onAction
}: {
    title: string;
    items: Producto[];
    type: "available" | "repair";
    onAction: (id: string, qty: number) => void;
}) {
    const isRepair = type === "repair";

    return (
        <div className={`min-w-[200px] flex-1 flex flex-col rounded-xl overflow-hidden border ${isRepair ? 'bg-red-950/20 border-red-500/20' : 'bg-card/50 border-border'}`}>
            <div className={`p-4 border-b font-semibold flex items-center justify-between ${isRepair ? 'border-red-500/20 text-red-500' : 'border-border'}`}>
                <span className="flex items-center gap-2">
                    {isRepair && <Wrench className="h-4 w-4" />}
                    {title}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isRepair ? 'bg-red-500/10' : 'bg-secondary text-muted-foreground'}`}>
                    {items.length}
                </span>
            </div>

            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground/50 h-32 border-2 border-dashed border-border/50 rounded-lg">
                        <Box className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm">Vacío</span>
                    </div>
                ) : (
                    items.map(p => (
                        <FlipProductCard
                            key={p.id}
                            item={p}
                            type={type}
                            onAction={onAction}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function FlipProductCard({ item, type, onAction }: { item: Producto, type: "available" | "repair", onAction: (id: string, qty: number) => void }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [actionQty, setActionQty] = useState(1);

    const isRepair = type === "repair";
    const qtyShown = isRepair ? item.unidadesEnReparacion : (item.unidadesTotales - item.unidadesEnReparacion);

    // Reset qty if bounds change or card closes
    useEffect(() => {
        setActionQty(1);
    }, [isFlipped, qtyShown]);

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAction(item.id, actionQty);
        setIsFlipped(false);
    };

    return (
        <div
            className="group relative h-[72px] w-full perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div className={`w-full h-full transition-transform duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>

                {/* FRONT */}
                <div className={`absolute inset-0 backface-hidden flex flex-col p-2 rounded-lg border shadow-sm ${isRepair ? 'bg-red-950/50 border-red-500/20 hover:border-red-500/40' : 'bg-card border-border hover:border-muted-foreground/30'}`}>
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-xs leading-tight line-clamp-2 pr-2">{item.nombre}</h3>
                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none shrink-0 ${isRepair ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                            x{qtyShown}
                        </div>
                    </div>
                    {isRepair && (
                        <div className="mt-auto text-[9px] text-red-400 capitalize bg-red-500/10 px-1 py-px rounded self-start border border-red-500/20">
                            {item.categoria}
                        </div>
                    )}
                </div>

                {/* BACK */}
                <div className={`absolute inset-0 backface-hidden rotate-y-180 flex px-2 justify-between items-center rounded-lg border shadow-sm ${isRepair ? 'bg-green-950/20 border-green-500/30' : 'bg-orange-950/20 border-orange-500/30'}`}>
                    <select
                        className="bg-background border border-border rounded px-1.5 text-[10px] h-6 outline-none cursor-pointer w-[70px]"
                        value={actionQty}
                        onChange={(e) => setActionQty(Number(e.target.value))}
                        onClick={e => e.stopPropagation()}
                    >
                        {Array.from({ length: qtyShown }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} u.</option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        variant="default"
                        className={`h-6 px-2 shrink-0 text-[10px] font-medium ${isRepair ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                        onClick={handleAction}
                    >
                        {isRepair ? <RotateCcw className="h-3 w-3 mr-1" /> : <Wrench className="h-3 w-3 mr-1" />}
                        Ok
                    </Button>
                </div>
            </div>
        </div>
    );
}
