import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router';
import {useData} from '../context/DataContext';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card';
import {Badge} from './ui/badge';
import {Separator} from './ui/separator';
import {
    AlertCircle,
    ArrowLeft,
    Calendar,
    CalendarIcon,
    Droplets,
    Edit,
    MapPin,
    Plus,
    Power,
    PowerOff,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './ui/alert-dialog';
import {toast} from 'sonner';
import {familyService} from '../services/familyService';
import {waterDeliveryService} from '../services/waterDeliveryService';
import {FamilyDTO, WaterDeliveryDTO} from '../types';
import {usePermission} from "./hooks/usePermission";

export function FamilyDetails() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {addWaterDelivery} = useData();

    const {hasPermission} = usePermission();

    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryVolume, setDeliveryVolume] = useState('');
    const [volumeSent, setVolumeSent] = useState('');
    const [family, setFamily] = useState<FamilyDTO | null>(null);
    const [loadingFamily, setLoadingFamily] = useState(true);
    const [deliveries, setDeliveries] = useState<WaterDeliveryDTO[]>([]);
    const [isTogglingActive, setIsTogglingActive] = useState(false);

    const familyIdNum = Number(id);

    useEffect(() => {
        if (!id || Number.isNaN(familyIdNum)) {
            setLoadingFamily(false);
            setFamily(null);
            return;
        }

        let cancelled = false;

        const loadFamilyData = async () => {
            setLoadingFamily(true);
            try {
                const [familyData, deliveriesData] = await Promise.all([
                    familyService.findFamilyById(familyIdNum),
                    waterDeliveryService.findByYearAndFamilyId(new Date().getFullYear(), familyIdNum),
                ]);
                if (!cancelled) {
                    setFamily(familyData);
                    setDeliveries(deliveriesData);
                }
            } catch (error) {
                console.error(error);
                if (!cancelled) {
                    setFamily(null);
                    setDeliveries([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingFamily(false);
                }
            }
        };

        loadFamilyData();

        return () => {
            cancelled = true;
        };
    }, [id, familyIdNum]);

    if (loadingFamily) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Card className="text-center py-12">
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">Carregando família...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!family) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <Card className="text-center py-12">
                    <CardContent className="pt-6">
                        <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Família não encontrada</h3>
                        <Button onClick={() => navigate('/')}>Voltar para lista</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalCapacity = family.cisterns.reduce((sum, c) => sum + c.capacityLiters, 0) || 1;
    const currentLevel = family.cisterns.reduce((sum, c) => sum + c.currentLevelLiters, 0);
    const percentageFull = Math.round((currentLevel / totalCapacity) * 100);
    const daysUntilEmpty = family.remainingDays ?? 0;
    const dailyConsumption = family.dailyConsumption ?? 0;
    const nextDateRaw = family.nextDeliveryDate;
    const isFamilyActive = family.active !== false;

    const handleAddDelivery = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isFamilyActive) {
            toast.error('Não é possível registrar entrega para uma família inativa');
            return;
        }

        if (!deliveryVolume || parseFloat(deliveryVolume) <= 0) {
            toast.error('Digite o volume entregue');
            return;
        }

        if (!volumeSent || parseFloat(volumeSent) <= 0) {
            toast.error('Digite o volume enviado');
            return;
        }

        const volume = parseFloat(deliveryVolume);
        const sent = parseFloat(volumeSent);

        if (volume > totalCapacity) {
            toast.error('Volume entregue excede a capacidade total das cisternas');
            return;
        }

        if (volume > sent) {
            toast.error('Volume entregue não pode ser maior que o volume enviado');
            return;
        }

        try {
            await addWaterDelivery({
                familyId: family.id!,
                deliveryDate: deliveryDate, // yyyy-MM-dd
                deliveredAmountLiters: volume,
                requestedAmountLiters: sent,
            });

            toast.success('Entrega de água registrada!');
            setDeliveryVolume('');
            setVolumeSent('');

            const [updatedFamily, updatedDels] = await Promise.all([
                familyService.findFamilyById(familyIdNum),
                waterDeliveryService.findByYearAndFamilyId(new Date().getFullYear(), familyIdNum),
            ]);
            setFamily(updatedFamily);
            setDeliveries(updatedDels);
        } catch (e: any) {
            toast.error(e.message || 'Erro ao registrar entrega');
        }
    };

    const sortedDeliveries = [...deliveries].sort(
        (a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
    );

    const handleToggleFamilyActive = async () => {
        if (!family.id) return;

        setIsTogglingActive(true);
        const nextActive = !isFamilyActive;
        try {
            if (isFamilyActive) {
                await familyService.deactivateFamily(family.id);
            } else {
                await familyService.activateFamily(family.id);
            }

            setFamily((prev) => (prev ? {...prev, active: nextActive} : prev));
            toast.success(isFamilyActive ? 'Família desativada' : 'Família ativada');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar status da família';
            toast.error(message);
        } finally {
            setIsTogglingActive(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={() => navigate('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                {(hasPermission('MANAGE_USERS') || hasPermission('ADMIN') || hasPermission('EDIT_FAMILY')) && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/familia/${family.id}/editar`)}
                            disabled={!isFamilyActive}
                            title={
                                !isFamilyActive
                                    ? 'Não é possível editar uma família inativa'
                                    : 'Editar família'
                            }
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={
                                        isFamilyActive
                                            ? 'text-destructive hover:text-destructive'
                                            : 'text-green-700 hover:text-green-700'
                                    }
                                    disabled={isTogglingActive}
                                >
                                    {isFamilyActive ? (
                                        <>
                                            <PowerOff className="mr-2 h-4 w-4" />
                                            Desativar
                                        </>
                                    ) : (
                                        <>
                                            <Power className="mr-2 h-4 w-4" />
                                            Ativar
                                        </>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        {isFamilyActive ? 'Desativar família?' : 'Ativar família?'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {isFamilyActive
                                            ? `A família "${family.name}" será desativada e deixará de aparecer nas operações ativas do sistema.`
                                            : `A família "${family.name}" será reativada e voltará a participar das operações do sistema.`}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isTogglingActive}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleToggleFamilyActive}
                                        disabled={isTogglingActive}
                                        className={
                                            isFamilyActive
                                                ? 'bg-destructive hover:bg-destructive/90'
                                                : 'bg-green-600 hover:bg-green-600/90'
                                        }
                                    >
                                        {isTogglingActive
                                            ? 'Salvando...'
                                            : isFamilyActive
                                                ? 'Desativar'
                                                : 'Ativar'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6 order-2 lg:order-none">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl mb-2">{family.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Lat: {family.latitude.toFixed(4)}, Long:{' '}
                                        {family.longitude.toFixed(4)}
                                    </CardDescription>
                                </div>
                                {family.familyStatus === 'CRITICO' && (
                                    <Badge variant="destructive" className="text-sm">
                                        Entrega Urgente
                                    </Badge>
                                )}
                                    {!isFamilyActive && (
                                        <Badge
                                            variant="outline"
                                            className="border-amber-300 bg-amber-50 text-amber-800 text-sm"
                                        >
                                            Inativa
                                        </Badge>
                                    )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Membros</p>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{family.members.length} pessoas</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Capacidade Total</p>
                                    <div className="flex items-center gap-2">
                                        <Droplets className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                      {totalCapacity}L
                    </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Consumo Diário</p>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{dailyConsumption} L/dia</span>
                                    </div>
                                </div>
                            </div>

                            {family.hasGutterSystem && (
                                <Badge variant="outline">Sistema de captação de chuva instalado</Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Status da Cisterna</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Nível Atual</span>
                                    <span className="text-2xl font-bold">{percentageFull}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-4">
                                    <div
                                        className={`h-4 rounded-full transition-all ${
                                            percentageFull < 20
                                                ? 'bg-red-500'
                                                : percentageFull < 50
                                                    ? 'bg-yellow-500'
                                                    : 'bg-blue-500'
                                        }`}
                                        style={{width: `${Math.min(100, percentageFull)}%`}}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {currentLevel}L de {totalCapacity}L
                                </p>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Dias Restantes</p>
                                    <p className="text-xl font-semibold">
                                        {daysUntilEmpty > 0 ? `${daysUntilEmpty} dias` : 'Cisterna Quase vazia'}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Próxima Entrega Prevista</p>
                                    <p className="text-xl font-semibold">
                                        {nextDateRaw ? new Date(nextDateRaw).toLocaleDateString('pt-BR') : 'Não calculado'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Membros da Família</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {family.members.map((member, idx) => (
                                    <div
                                        key={member.id || idx}
                                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium">{member.name}</p>
                                            <p className="text-sm text-muted-foreground">{member.age} anos</p>
                                        </div>
                                        {member.isBedridden && (
                                            <Badge variant="secondary" className="text-xs">
                                                Acamado
                                            </Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cisternas Cadastradas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {family.cisterns.map((cistern, index) => (
                                    <div
                                        key={cistern.id || index}
                                        className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-blue-900">Cisterna {index + 1}</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Capacidade</p>
                                                <p className="font-medium">{cistern.capacityLiters}L</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Volume Atual</p>
                                                <p className="font-medium">{cistern.currentLevelLiters}L</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 order-1 lg:order-none">
                    <Card className={!isFamilyActive ? 'opacity-75' : undefined}>
                        <CardHeader>
                            <CardTitle>Registrar Entrega</CardTitle>
                            <CardDescription>
                                {isFamilyActive
                                    ? 'Adicione uma nova entrega de água'
                                    : 'Família inativa — o registro de entregas está desabilitado'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddDelivery} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deliveryDate">Data da Entrega</Label>
                                    <div className="relative">
                                        <Input
                                            id="deliveryDate"
                                            type="date"
                                            value={deliveryDate}
                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                            required
                                            disabled={!isFamilyActive}
                                            className="[&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                        <CalendarIcon
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${
                                                isFamilyActive ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                            }`}
                                            onClick={() => {
                                                if (!isFamilyActive) return;
                                                const input = document.getElementById('deliveryDate') as HTMLInputElement;
                                                input?.showPicker();
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deliveryVolume">Volume Entregue (litros)</Label>
                                    <Input
                                        id="deliveryVolume"
                                        type="number"
                                        value={deliveryVolume}
                                        onChange={(e) => setDeliveryVolume(e.target.value)}
                                        placeholder="Ex: 8000"
                                        min="1"
                                        required
                                        disabled={!isFamilyActive}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="volumeSent">Volume Enviado (litros)</Label>
                                    <Input
                                        id="volumeSent"
                                        type="number"
                                        value={volumeSent}
                                        onChange={(e) => setVolumeSent(e.target.value)}
                                        placeholder="Ex: 8000"
                                        min="1"
                                        required
                                        disabled={!isFamilyActive}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={!isFamilyActive}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Registrar Entrega
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Entregas</CardTitle>
                            <CardDescription>Entregas de {new Date().getFullYear()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {sortedDeliveries.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Nenhuma entrega registrada
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {sortedDeliveries.map((delivery) => (
                                        <div key={delivery.id} className="space-y-1 p-3 bg-secondary/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Solicitado:</span>
                                                <span className="font-medium">{delivery.requestedAmountLiters}L</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Entregue:</span>
                                                <span
                                                    className="font-medium text-blue-600">{delivery.deliveredAmountLiters}L</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}