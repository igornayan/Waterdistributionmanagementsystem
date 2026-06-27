import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router';
import {useData} from '../context/DataContext';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from './ui/card';
import {Badge} from './ui/badge';
import {AlertCircle, ArrowUpDown, Calendar, Droplets, MapPin, Plus, Search, Users} from 'lucide-react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from './ui/select';
import {usePermission} from "./hooks/usePermission";

export function FamilyList() {
    const navigate = useNavigate();
    const {families, loadingFamilies, fetchFamilies} = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'urgency' | 'name' | 'level-asc' | 'level-desc'>('urgency');

    const {hasPermission} = usePermission();

    useEffect(() => {
        fetchFamilies();
    }, [fetchFamilies]);

    const getFamilyStatusBadge = (status?: string) => {
        switch (status) {
            case 'CRITICO':
            case 'URGENTE':
                return {label: 'Urgente', variant: 'destructive' as const};
            case 'ALERTA': // Assumindo caso haja status intermediário
                return {label: 'Atenção', variant: 'default' as const};
            case 'NORMAL':
            default:
                return {label: 'Normal', variant: 'secondary' as const};
        }
    };

    const filteredAndSortedFamilies = useMemo(() => {
        // Filtrar por nome
        let filtered = families.filter((family) =>
            family.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Ordenar
        const sorted = [...filtered].sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }

            const totalCapA = a.cisterns.reduce((sum, c) => sum + c.capacityLiters, 0) || 1;
            const totalLvlA = a.cisterns.reduce((sum, c) => sum + c.currentLevelLiters, 0);
            const percA = (totalLvlA / totalCapA) * 100;

            const totalCapB = b.cisterns.reduce((sum, c) => sum + c.capacityLiters, 0) || 1;
            const totalLvlB = b.cisterns.reduce((sum, c) => sum + c.currentLevelLiters, 0);
            const percB = (totalLvlB / totalCapB) * 100;

            if (sortBy === 'level-asc') return percA - percB;
            if (sortBy === 'level-desc') return percB - percA;

            // Ordenação por urgência baseada no status e dias restantes
            if (a.familyStatus === 'CRITICO' && b.familyStatus !== 'CRITICO') return -1;
            if (a.familyStatus !== 'CRITICO' && b.familyStatus === 'CRITICO') return 1;

            return (a.remainingDays || 999) - (b.remainingDays || 999);
        });

        return sorted;
    }, [families, searchTerm, sortBy]);

    return (
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">Gerenciamento de Água</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Sistema de distribuição de água para famílias com cisternas
                    </p>
                </div>
                {(hasPermission('MANAGE_USERS') || hasPermission('ADMIN')) && (
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/configuracoes')}
                            className="flex-1 sm:flex-none"
                        >
                            Configurações
                        </Button>
                        <Button
                            onClick={() => navigate('/nova-familia')}
                            className="flex-1 sm:flex-none"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Família
                        </Button>
                    </div>
                )}
            </div>

            {loadingFamilies ? (
                <div className="flex justify-center items-center py-12">Carregando famílias...</div>
            ) : families.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent className="pt-6">
                        <Droplets className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma família cadastrada</h3>
                        <p className="text-muted-foreground mb-6">
                            Comece cadastrando a primeira família no sistema
                        </p>
                        {(hasPermission('MANAGE_USERS') || hasPermission('ADMIN') || hasPermission('EDIT_FAMILY')) && (
                            <Button onClick={() => navigate('/nova-familia')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Cadastrar Primeira Família
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Barra de Filtros */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar família por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex items-center gap-2 sm:w-64">
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ordenar por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="urgency">Urgência</SelectItem>
                                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                                    <SelectItem value="level-desc">Nível (Maior)</SelectItem>
                                    <SelectItem value="level-asc">Nível (Menor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Contador de resultados */}
                    {searchTerm && (
                        <div className="mb-4 text-sm text-muted-foreground">
                            {filteredAndSortedFamilies.length === 0 ? (
                                'Nenhuma família encontrada'
                            ) : filteredAndSortedFamilies.length === 1 ? (
                                '1 família encontrada'
                            ) : (
                                `${filteredAndSortedFamilies.length} famílias encontradas`
                            )}
                        </div>
                    )}

                    {/* Grid de Famílias */}
                    {filteredAndSortedFamilies.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent className="pt-6">
                                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Nenhuma família encontrada</h3>
                                <p className="text-muted-foreground mb-6">
                                    Tente ajustar os filtros de busca
                                </p>
                                <Button variant="outline" onClick={() => setSearchTerm('')}>
                                    Limpar Busca
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedFamilies.map((family) => {
                                const badge = getFamilyStatusBadge(family.familyStatus);
                                const isFamilyActive = family.active !== false;
                                const totalCapacity = family.cisterns.reduce((sum, c) => sum + c.capacityLiters, 0);
                                const currentLevel = family.cisterns.reduce((sum, c) => sum + c.currentLevelLiters, 0);
                                const percentageFull = totalCapacity ? Math.round((currentLevel / totalCapacity) * 100) : 0;

                                const daysUntilEmpty = family.remainingDays ?? 0;
                                const nextDateRaw = family.nextDeliveryDate;

                                return (
                                    <Card
                                        key={family.id}
                                        className={`cursor-pointer hover:shadow-lg transition-shadow ${
                                            !isFamilyActive ? 'opacity-80' : ''
                                        }`}
                                        onClick={() => navigate(`/familia/${family.id}`)}
                                    >
                                        <CardHeader>
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <CardTitle className="text-xl">{family.name}</CardTitle>
                                                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                                    {!isFamilyActive && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-amber-300 bg-amber-50 text-amber-800"
                                                        >
                                                            Inativa
                                                        </Badge>
                                                    )}
                                                    <Badge variant={badge.variant}>{badge.label}</Badge>
                                                </div>
                                            </div>
                                            <CardDescription className="flex items-center gap-2">
                                                <MapPin className="h-3 w-3" />
                                                {family.latitude.toFixed(4)},{' '}
                                                {family.longitude.toFixed(4)}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <span>{family.members.length} pessoas</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <p className="text-xs text-muted-foreground">Capacidade</p>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Droplets className="h-4 w-4 text-muted-foreground" />
                                                            <span>{totalCapacity}L</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Nível da cisterna</span>
                                                        <span className="font-medium">{percentageFull}%</span>
                                                    </div>
                                                    <div className="w-full bg-secondary rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${
                                                                percentageFull < 20
                                                                    ? 'bg-red-500'
                                                                    : percentageFull < 50
                                                                        ? 'bg-yellow-500'
                                                                        : 'bg-blue-500'
                                                            }`}
                                                            style={{width: `${Math.min(100, percentageFull)}%`}}
                                                        />
                                                    </div>
                                                </div>

                                                {daysUntilEmpty <= 7 && daysUntilEmpty > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-orange-600">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <span>{daysUntilEmpty} dias restantes</span>
                                                    </div>
                                                )}

                                                {nextDateRaw && (
                                                    <div
                                                        className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                                        <Calendar className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm text-blue-700 font-medium">
                              Próx entrega: {new Date(nextDateRaw).toLocaleDateString('pt-BR')}
                            </span>
                                                    </div>
                                                )}

                                                {family.hasGutterSystem && (
                                                    <Badge variant="outline" className="text-xs">
                                                        Sistema de captação
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}